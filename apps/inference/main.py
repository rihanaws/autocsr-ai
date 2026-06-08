import hashlib
import hmac
import ipaddress
import os
import subprocess
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

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

# Number of trusted reverse-proxy hops in front of this service (Railway = 1).
TRUSTED_PROXY_HOPS: int = int(os.getenv("TRUSTED_PROXY_HOPS", "1"))

PILOT_TENANT_ID: str = os.getenv("PILOT_TENANT_ID", "")

PIPELINE_DIR: str = os.getenv(
    "PIPELINE_DIR",
    os.path.join(os.path.dirname(__file__), "..", "..", "pipeline"),
)


def get_real_client_ip(request: Request) -> str | None:
    """
    Returns the real client IP by reading the entry just before the trusted proxy
    hops in X-Forwarded-For. Returns None when header is absent, too short, or
    contains a non-parseable IP at the selected position.

    XFF layout: <client>, <proxy1>, ..., <our-proxy>
    With TRUSTED_PROXY_HOPS=1 we want entries[-2] (what our proxy received).
    """
    xff = request.headers.get("X-Forwarded-For", "")
    entries = [e.strip() for e in xff.split(",") if e.strip()]
    if not entries:
        return None
    idx = len(entries) - TRUSTED_PROXY_HOPS - 1
    if idx < 0:
        return None
    candidate = entries[idx]
    try:
        ipaddress.ip_address(candidate)
    except ValueError:
        return None
    return candidate


async def get_tenant_authorized_ips(pool: asyncpg.Pool, tenant_id: str) -> list[str]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            'SELECT "authorizedIps" FROM "Tenant" WHERE id = $1', tenant_id
        )
        return list(row["authorizedIps"]) if row else []


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


_db_pool: asyncpg.Pool | None = None


async def _get_pool() -> asyncpg.Pool:
    global _db_pool
    if _db_pool is None:
        _db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
    return _db_pool


async def create_query_event(
    pool: asyncpg.Pool,
    *,
    tenant_id: str,
    query_text: str,
    response_text: str,
    agent_type: str,
    cache_hit: bool,
    confidence: float,
    resolution_ms: int,
    flagged: bool,
    model_version: str = "hermes-3-llama-3.1-8b",
) -> str:
    """Insert a QueryEvent row. Returns the new event id. Never raises."""
    event_id   = str(uuid.uuid4())
    query_hash = hashlib.sha256(
        f"{tenant_id}:{query_text.lower().strip()}".encode()
    ).hexdigest()[:16]
    try:
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO "QueryEvent" (
                    id, "tenantId", "queryHash", "queryText",
                    "responseText", "agentType", "cacheHit",
                    "resolved", "confidenceScore", "resolutionMs",
                    "modelVersion", "flaggedForReview", "createdAt"
                ) VALUES ($1,$2,$3,$4,$5,$6::\"AgentType\",$7,$8,$9,$10,$11,$12,NOW())
                """,
                event_id,
                tenant_id,
                query_hash,
                query_text,
                response_text,
                agent_type.upper(),
                cache_hit,
                not flagged,
                confidence,
                resolution_ms,
                model_version,
                flagged,
            )
    except Exception as e:
        print(f"[query_event] write failed: {type(e).__name__}: {e}", flush=True)
        return ""
    return event_id


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

    pool = await _get_pool()

    allowed_ips = await get_tenant_authorized_ips(pool, body.tenant_id)
    if allowed_ips:
        client_ip = get_real_client_ip(request)
        if not client_ip or client_ip not in allowed_ips:
            raise HTTPException(status_code=403, detail="IP not authorized")

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

    # Semantic cache lookup
    cached = lookup(clean_query, body.tenant_id)
    if cached:
        resolution_ms = int((time.monotonic() - started) * 1000)
        await create_query_event(
            pool,
            tenant_id     = body.tenant_id,
            query_text    = clean_query,
            response_text = cached["response"],
            agent_type    = cached.get("agent_type", "GENERAL"),
            cache_hit     = True,
            confidence    = cached.get("confidence", 1.0),
            resolution_ms = resolution_ms,
            flagged       = cached.get("flagged", False),
            model_version = "cache",
        )
        return InferResponse(
            response=cached["response"],
            agent_type=cached["agent_type"],
            cache_hit=True,
            confidence=cached["confidence"],
            resolution_ms=resolution_ms,
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

    query_event_id = await create_query_event(
        pool,
        tenant_id     = body.tenant_id,
        query_text    = clean_query,
        response_text = guard_out["response"],
        agent_type    = result["agent_type"],
        cache_hit     = False,
        confidence    = guard_out["confidence"],
        resolution_ms = resolution_ms,
        flagged       = final_flagged,
    )

    # Async auditor — fire and forget, never blocks response
    schedule_audit(
        tenant_id      = body.tenant_id,
        query          = clean_query,
        response       = guard_out["response"],
        agent_type     = result["agent_type"],
        query_event_id = query_event_id,
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


ACTIVE_TRAINING_STATUSES = ("QUEUED", "RUNNING", "TRAINING", "EVALUATING")


@app.post("/api/training/weekly-trigger")
async def weekly_training_trigger(
    request: Request,
    x_qstash_signature: Optional[str] = Header(None),
):
    body_bytes = await request.body()
    if not x_qstash_signature or not _verify_qstash_signature(body_bytes, x_qstash_signature):
        raise HTTPException(status_code=401, detail="Invalid QStash signature")

    async with asyncpg.create_pool(DATABASE_URL) as pool:
        async with pool.acquire() as conn:
            # Idempotency guard — refuse to start if a run is already active
            active = await conn.fetchval(
                'SELECT id FROM "TrainingRun" WHERE status = ANY($1::text[]) LIMIT 1',
                list(ACTIVE_TRAINING_STATUSES),
            )
            if active:
                return {"status": "skipped", "reason": "training run already active", "active_run_id": active}

            training_run_id = str(uuid.uuid4())
            await conn.execute(
                '''
                INSERT INTO "TrainingRun" (id, status, "tenantId", "createdAt")
                VALUES ($1, $2, $3, NOW())
                ''',
                training_run_id,
                "QUEUED",
                PILOT_TENANT_ID or "global",
            )

    pipeline_dir = os.path.realpath(PIPELINE_DIR)
    subprocess.Popen(
        ["python", os.path.join(pipeline_dir, "run_pipeline.py"), training_run_id, "general"],
        cwd=pipeline_dir,
        env={**os.environ, "PIPELINE_TENANT_ID": PILOT_TENANT_ID},
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    return {"status": "queued", "training_run_id": training_run_id}
