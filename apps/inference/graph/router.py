import json
import os

from openai import OpenAI

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


AGENT_TYPES = ["DEPOSIT", "WITHDRAWAL", "VERIFICATION", "ONBOARDING", "GENERAL"]

SYSTEM_PROMPT = """You are a CSR query classifier for an online betting platform.
Classify the user query into exactly one of: DEPOSIT, WITHDRAWAL, VERIFICATION, ONBOARDING, GENERAL.
Return JSON: {"agent": "<TYPE>", "confidence": <0.0-1.0>}

Rules:
- DEPOSIT: failed deposits, pending payments, balance not credited
- WITHDRAWAL: withdrawal requests, limits, pending withdrawals
- VERIFICATION: KYC, identity documents, account verification
- ONBOARDING: new accounts, registration, welcome bonus
- GENERAL: everything else
- If confidence < 0.7, return GENERAL regardless of agent field"""


def classify(query: str) -> tuple[str, float]:
    try:
        client = _get_client()
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": query},
            ],
            response_format={"type": "json_object"},
            temperature=0,
            max_tokens=64,
        )
        data = json.loads(resp.choices[0].message.content or "{}")
        agent = data.get("agent", "GENERAL")
        confidence = float(data.get("confidence", 0.0))

        if agent not in AGENT_TYPES:
            agent = "GENERAL"
        if confidence < 0.7:
            agent = "GENERAL"

        return agent, confidence

    except Exception:
        return "GENERAL", 0.0
