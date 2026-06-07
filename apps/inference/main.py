import hashlib
import hmac
import os
import subprocess
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

import asyncpg
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from auditor.judge import schedule_audit
from cache.semantic import lookup, write
from graph.guards.input_guard import check_input
from graph.guards.output_guard import check_output
from graph.workflow import workflow

app = FastAPI(title="AutoCSR Inference", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)

INFERENCE_API_SECRET = os.getenv("INFERENCE_API_SECRET", "")
if not INFERENCE_API_SECRET:
    raise RuntimeError("INFERENCE_API_SECRET env var is required and must be non-empty")

QSTASH_CURRENT_SIGNING_KEY = os.getenv("QSTASH_CURRENT_SIGNING_KEY", "")
QSTASH_NEXT_SIGNING_KEY    = os.getenv("QSTASH_NEXT_SIGNING_KEY", "")
DATABASE_URL               = os.getenv("DATABASE_URL", "")
if not QSTASH_CURRENT_SIGNING_KEY or not QSTASH_NEXT_SIGNING_KEY:
    raise RuntimeError("QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY are required")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required")

security = HTTPBearer()

# OKBET IP allowlist — "153.53.81" is a /24 prefix; checked via startswith.
OKBET_ALLOWED_IPS: set[str] = {
    "153.53.81",
    "89.117.176.115",
    "103.170.173.26",
}

# Number of trusted reverse-proxy hops in front of this service (Railway = 1).
# We read the Nth-from-right entry in X-Forwarded-For to skip spoofable left entries.
TRUSTED_PROXY_HOPS: int = int(os.getenv("TRUSTED_PROXY_HOPS", "1"))


def get_real_client_ip(request: Request) -> str:
    """
    Returns the real client IP by reading TRUSTED_PROXY_HOPS entries from the
    right of X-Forwarded-For (the portion appended by trusted infrastructure).
    Falls back to request.client.host when the header is absent.

    Never trusts the leftmost XFF entry directly — that field is client-controlled.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        entries = [e.strip() for e in forwarded.split(",")]
        # Take the entry added by our outermost trusted proxy
        idx = max(0, len(entries) - TRUSTED_PROXY_HOPS)
        return entries[idx]
    return request.client.host if request.client else ""


class InferRequest(BaseModel):
    query: str
    tenant_id: str
    session_id: Optional[str] = None


class InferResponse(BaseModel):
    response: str
    agent_type: str
    cache_hit: bool
    confidence: float
    resolution_ms: int
    flagged: bool


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.3.0"}


@app.post("/api/infer", response_model=InferResponse)
async def infer(
    body: InferRequest,
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> InferResponse:
    if INFERENCE_API_SECRET and credentials.credentials != INFERENCE_API_SECRET:
        raise HTTPException(status_code=401, detail="Invalid API secret")

    if body.tenant_id == "okbet":
        ip = get_real_client_ip(request)
        allowed = any(ip == allowed_ip or ip.startswith(allowed_ip + ".") for allowed_ip in OKBET_ALLOWED_IPS)
        if not allowed:
            raise HTTPException(status_code=403, detail=f"IP {ip} not authorized for this tenant")

    started = time.monotonic()

    # Input guard: scope filter + PII redaction
    guard_result = check_input(body.query, body.tenant_id)
    if not guard_result["passed"]:
        return InferResponse(
            response=guard_result["response"],
            agent_type="GENERAL",
            cache_hit=False,
            confidence=1.0,
            resolution_ms=int((time.monotonic() - started) * 1000),
            flagged=False,
        )

    clean_query = guard_result["query"]

    # Semantic cache lookup (use redacted query for cache key consistency)
    cached = lookup(clean_query, body.tenant_id)
    if cached:
        return InferResponse(
            response=cached["response"],
            agent_type=cached["agent_type"],
            cache_hit=True,
            confidence=cached["confidence"],
            resolution_ms=int((time.monotonic() - started) * 1000),
            flagged=cached.get("flagged", False),
        )

    # Run LangGraph workflow
    result = workflow.invoke(
        {
            "query": clean_query,
            "tenant_id": body.tenant_id,
            "session_id": body.session_id,
            "agent_type": "GENERAL",
            "confidence": 0.0,
            "response": "",
            "cache_hit": False,
            "flagged": False,
            "resolution_ms": 0,
        }
    )

    # Output guard: PII scrub + hallucination risk + confidence scoring
    guard_out = check_output(
        response=result["response"],
        agent_type=result["agent_type"],
        confidence=result["confidence"],
    )

    # Merge guard flags — either agent or output guard can flag
    final_flagged = result.get("flagged", False) or guard_out["flagged"]

    resolution_ms = int((time.monotonic() - started) * 1000)

    payload = {
        "response": guard_out["response"],
        "agent_type": result["agent_type"],
        "confidence": guard_out["confidence"],
        "flagged": final_flagged,
    }

    # Cache write — fire and forget
    write(clean_query, body.tenant_id, payload)

    # Async auditor — fire and forget, never blocks response
    schedule_audit(
        tenant_id=body.tenant_id,
        query=clean_query,
        response=guard_out["response"],
        agent_type=result["agent_type"],
    )

    return InferResponse(
        response=guard_out["response"],
        agent_type=result["agent_type"],
        cache_hit=False,
        confidence=guard_out["confidence"],
        resolution_ms=resolution_ms,
        flagged=final_flagged,
    )


def _verify_qstash_signature(body: bytes, signature: str) -> bool:
    """
    QStash signs with the current key; falls back to next key during rotation.
    Signature header format: "Bearer <hex_digest>".
    """
    received = signature.removeprefix("Bearer ")
    for key in (QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY):
        expected = hmac.new(key.encode(), body, hashlib.sha256).hexdigest()
        if hmac.compare_digest(expected, received):
            return True
    return False


@app.post("/api/training/weekly-trigger")
async def weekly_training_trigger(
    request: Request,
    x_qstash_signature: Optional[str] = Header(None),
):
    body_bytes = await request.body()
    if not x_qstash_signature or not _verify_qstash_signature(body_bytes, x_qstash_signature):
        raise HTTPException(status_code=401, detail="Invalid QStash signature")

    training_run_id = str(uuid.uuid4())

    async with asyncpg.create_pool(DATABASE_URL) as pool:
        async with pool.acquire() as conn:
            await conn.execute(
                'INSERT INTO "TrainingRun" (id, status, "createdAt") VALUES ($1, $2, $3)',
                training_run_id,
                "QUEUED",
                datetime.now(timezone.utc),
            )

    subprocess.Popen(
        ["python", "pipeline/run_pipeline.py", training_run_id, "general"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    return {"status": "queued", "training_run_id": training_run_id}
