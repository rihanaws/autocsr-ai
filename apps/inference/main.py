import hashlib
import ipaddress
import os
import subprocess
import time
import uuid
from typing import Optional

import jwt as pyjwt
from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager

import asyncpg
from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from auditor.judge import schedule_audit
from cache.semantic import (
    _TENANT_ID_RE,
    _get_index,
    _validate_tenant_id,
    cache_lookup,
    cache_write,
)
from graph.guards.input_guard import check_input
from graph.guards.output_guard import check_output
from graph.workflow import workflow

_REQUIRED_TABLES = ("Tenant", "QueryEvent", "KnowledgeChunk")


async def _assert_app_database(pool: asyncpg.Pool) -> None:
    """Fail fast if DATABASE_URL points at the wrong database.

    The shell exports a DATABASE_URL for a different local project, and
    load_dotenv() does not override pre-set env vars — writes then vanish
    silently into a DB where these tables don't exist.
    """
    rows = await pool.fetch(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public' AND table_name = ANY($1::text[])",
        list(_REQUIRED_TABLES),
    )
    missing = set(_REQUIRED_TABLES) - {r["table_name"] for r in rows}
    if missing:
        raise RuntimeError(
            f"DATABASE_URL points at the wrong database: missing tables {sorted(missing)}. "
            "Likely the shell DATABASE_URL leak — run `set -a && source .env && set +a` "
            "before starting uvicorn (see CLAUDE.md, Shell env leak)."
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _db_pool
    _db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
    await _assert_app_database(_db_pool)
    app.state.db_pool = _db_pool
    yield
    await _db_pool.close()


app = FastAPI(title="AutoCSR Inference", version="0.3.0", lifespan=lifespan)

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
QSTASH_NEXT_SIGNING_KEY = os.getenv("QSTASH_NEXT_SIGNING_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")
if not QSTASH_CURRENT_SIGNING_KEY or not QSTASH_NEXT_SIGNING_KEY:
    raise RuntimeError(
        "QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY are required"
    )
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


async def get_tenant_config(pool: asyncpg.Pool, tenant_id: str) -> dict:
    # DB failure here is fail-closed — raises 503, not silent []
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            'SELECT "authorizedIps", "cacheThreshold" FROM "Tenant" WHERE id = $1',
            tenant_id,
        )
    if not row:
        raise HTTPException(status_code=403, detail="Tenant not found")
    return {
        "authorized_ips": list(row["authorizedIps"] or []),
        "cache_threshold": float(row["cacheThreshold"] or 0.92),
    }


CHUNK_SIZE = 512
CHUNK_OVERLAP = 64


def _chunk_text(text: str) -> list[str]:
    chunks, start = [], 0
    while start < len(text):
        chunk = text[start : start + CHUNK_SIZE].strip()
        if chunk:
            chunks.append(chunk)
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


class KnowledgeEmbedRequest(BaseModel):
    tenantId: str
    documentId: str
    text: str
    name: str


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
    event_id = str(uuid.uuid4())
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


async def _update_doc_status(document_id: str, status: str, chunk_count: int) -> None:
    try:
        pool = app.state.db_pool
        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE "KnowledgeDocument"
                SET status = $1, "chunkCount" = $2
                WHERE id = $3
                """,
                status,
                chunk_count,
                document_id,
            )
    except Exception as e:
        print(f"[knowledge/embed] _update_doc_status error: {e}")


async def _embed_and_store(req: KnowledgeEmbedRequest) -> None:
    chunks = _chunk_text(req.text)
    if not chunks:
        await _update_doc_status(req.documentId, "FAILED", 0)
        return

    try:
        upserts = []
        db_chunks = []

        for i, chunk in enumerate(chunks):
            vector_id = f"kb_{req.tenantId}_{req.documentId}_{i}"
            upserts.append(
                {
                    "id": vector_id,
                    "data": chunk,
                    "metadata": {
                        "type": "knowledge",
                        "tenant_id": req.tenantId,
                        "document_id": req.documentId,
                        "chunk_index": i,
                        "source": req.name,
                        "content": chunk,
                    },
                }
            )
            db_chunks.append(
                (
                    vector_id,
                    req.tenantId,
                    chunk,
                    req.name,
                )
            )

        # Upstash Vector upsert — text-based, no embedding call needed
        index = _get_index()
        index.upsert(vectors=upserts)

        # Write KnowledgeChunk rows to Neon
        pool = app.state.db_pool
        async with pool.acquire() as conn:
            await conn.executemany(
                """
                INSERT INTO "KnowledgeChunk"
                    (id, "tenantId", content, source, "createdAt")
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (id) DO NOTHING
                """,
                db_chunks,
            )

        await _update_doc_status(req.documentId, "READY", len(chunks))
        print(f"[knowledge/embed] {len(chunks)} chunks stored — doc {req.documentId}")

    except Exception as e:
        print(f"[knowledge/embed] _embed_and_store error: {e}")
        await _update_doc_status(req.documentId, "FAILED", 0)


@app.post("/api/knowledge/embed")
async def embed_knowledge(
    req: KnowledgeEmbedRequest,
    background: BackgroundTasks,
    request: Request,
) -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer ") or auth_header[7:] != INFERENCE_API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Trust-boundary validation — both ids are concatenated into vector_id
    try:
        _validate_tenant_id(req.tenantId)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenantId")
    if not _TENANT_ID_RE.fullmatch(req.documentId):
        raise HTTPException(status_code=400, detail="Invalid documentId")

    background.add_task(_embed_and_store, req)
    return {"status": "queued", "documentId": req.documentId}


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

    pool = request.app.state.db_pool

    try:
        config = await get_tenant_config(pool, body.tenant_id)
    except HTTPException:
        raise
    except Exception:
        # DB unreachable — fail closed, never skip the IP allowlist
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    allowed_ips = config["authorized_ips"]
    cache_threshold = config["cache_threshold"]
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
    cached = cache_lookup(clean_query, body.tenant_id, threshold=cache_threshold)
    if cached:
        resolution_ms = int((time.monotonic() - started) * 1000)
        await create_query_event(
            pool,
            tenant_id=body.tenant_id,
            query_text=clean_query,
            response_text=cached["response"],
            agent_type=cached.get("agent_type", "GENERAL"),
            cache_hit=True,
            confidence=cached.get("confidence", 1.0),
            resolution_ms=resolution_ms,
            flagged=cached.get("flagged", False),
            model_version="cache",
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
    result = await workflow.ainvoke(
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
    cache_write(clean_query, body.tenant_id, payload)

    query_event_id = await create_query_event(
        pool,
        tenant_id=body.tenant_id,
        query_text=clean_query,
        response_text=guard_out["response"],
        agent_type=result["agent_type"],
        cache_hit=False,
        confidence=guard_out["confidence"],
        resolution_ms=resolution_ms,
        flagged=final_flagged,
    )

    # Async auditor — fire and forget, never blocks response
    schedule_audit(
        tenant_id=body.tenant_id,
        query=clean_query,
        response=guard_out["response"],
        agent_type=result["agent_type"],
        query_event_id=query_event_id,
    )

    return InferResponse(
        response=guard_out["response"],
        agent_type=result["agent_type"],
        cache_hit=False,
        confidence=guard_out["confidence"],
        resolution_ms=resolution_ms,
        flagged=final_flagged,
    )


def verify_qstash_signature(signature: str, destination_url: str) -> bool:
    """
    Verify QStash JWT. Tries current signing key first, then next key.
    QStash JWT claims: iss=Upstash, sub=destination URL, exp, nbf, iat, jti.
    """
    for key in [QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY]:
        if not key:
            continue
        try:
            payload = pyjwt.decode(
                signature,
                key,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            if payload.get("iss") != "Upstash":
                continue
            if payload.get("sub") != destination_url:
                continue
            return True
        except pyjwt.InvalidTokenError:
            continue
    return False


ACTIVE_TRAINING_STATUSES = ("QUEUED", "RUNNING", "TRAINING", "EVALUATING")


@app.post("/api/training/weekly-trigger")
async def weekly_training_trigger(
    request: Request,
    x_upstash_signature: Optional[str] = Header(None),
):
    sig = x_upstash_signature or ""
    url = str(request.url)
    if not verify_qstash_signature(sig, url):
        raise HTTPException(status_code=401, detail="Invalid QStash signature")

    pool = request.app.state.db_pool
    async with pool.acquire() as conn:
        # Idempotency guard — refuse to start if a run is already active
        active = await conn.fetchval(
            'SELECT id FROM "TrainingRun" WHERE status = ANY($1::text[]) LIMIT 1',
            list(ACTIVE_TRAINING_STATUSES),
        )
        if active:
            return {
                "status": "skipped",
                "reason": "training run already active",
                "active_run_id": active,
            }

        training_run_id = str(uuid.uuid4())
        await conn.execute(
            """
            INSERT INTO "TrainingRun" (id, status, "tenantId", "createdAt")
            VALUES ($1, $2, $3, NOW())
            """,
            training_run_id,
            "QUEUED",
            PILOT_TENANT_ID or "global",
        )

    pipeline_dir = os.path.realpath(PIPELINE_DIR)
    subprocess.Popen(
        [
            "python",
            os.path.join(pipeline_dir, "run_pipeline.py"),
            training_run_id,
            "general",
        ],
        cwd=pipeline_dir,
        env={**os.environ, "PIPELINE_TENANT_ID": PILOT_TENANT_ID},
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    return {"status": "queued", "training_run_id": training_run_id}
