import time
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os

from cache.semantic import lookup, write
from graph.workflow import workflow

app = FastAPI(title="AutoCSR Inference", version="0.2.0")

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
    return {"status": "ok", "version": "0.2.0"}


@app.post("/api/infer", response_model=InferResponse)
async def infer(
    body: InferRequest,
    x_api_secret: Optional[str] = Header(None),
):
    verify_secret(x_api_secret)
    started = time.monotonic()

    # Semantic cache lookup
    cached = lookup(body.query, body.tenant_id)
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
            "query": body.query,
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

    resolution_ms = int((time.monotonic() - started) * 1000)

    payload = {
        "response": result["response"],
        "agent_type": result["agent_type"],
        "confidence": result["confidence"],
        "flagged": result.get("flagged", False),
    }

    # Write to cache (fire and forget — don't block response)
    write(body.query, body.tenant_id, payload)

    return InferResponse(
        response=result["response"],
        agent_type=result["agent_type"],
        cache_hit=False,
        confidence=result["confidence"],
        resolution_ms=resolution_ms,
        flagged=result.get("flagged", False),
    )


@app.post("/api/training/weekly-trigger")
async def weekly_training_trigger(
    x_qstash_signature: Optional[str] = Header(None),
):
    # TODO: verify QStash signature + trigger training loop in Week 4
    return {"status": "received", "note": "training scheduler stub"}
