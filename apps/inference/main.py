import os
import time
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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


def verify_secret(x_api_secret: Optional[str]) -> None:
    if INFERENCE_API_SECRET and x_api_secret != INFERENCE_API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


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
    x_api_secret: Optional[str] = Header(None),
):
    verify_secret(x_api_secret)
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


@app.post("/api/training/weekly-trigger")
async def weekly_training_trigger(
    x_qstash_signature: Optional[str] = Header(None),
):
    # TODO: verify QStash signature + trigger training loop in Week 4
    return {"status": "received", "note": "training scheduler stub"}
