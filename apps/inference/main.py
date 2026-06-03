from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os

app = FastAPI(title="AutoCSR Inference", version="0.1.0")

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
    return {"status": "ok", "version": "0.1.0"}


@app.post("/api/infer", response_model=InferResponse)
async def infer(
    body: InferRequest,
    x_api_secret: Optional[str] = Header(None),
):
    verify_secret(x_api_secret)

    # TODO: wire LangGraph workflow in Week 2
    return InferResponse(
        response="[stub] LangGraph pipeline not yet wired.",
        agent_type="GENERAL",
        cache_hit=False,
        confidence=0.0,
        resolution_ms=0,
        flagged=False,
    )


@app.post("/api/training/weekly-trigger")
async def weekly_training_trigger(
    x_qstash_signature: Optional[str] = Header(None),
):
    # TODO: verify QStash signature + trigger training loop in Week 4
    return {"status": "received", "note": "training scheduler stub"}
