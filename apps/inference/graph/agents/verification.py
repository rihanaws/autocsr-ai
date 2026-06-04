import os

from openai import OpenAI

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


SYSTEM_PROMPT = """You are a specialized CSR agent for an online betting platform handling KYC and account verification.
You help with: identity verification, document submission, KYC status checks, account verification holds, and compliance document requirements.

Guidelines:
- Be concise, professional, and sensitive — verification involves personal documents
- Accepted document types: government-issued ID (passport, national ID, driver's license), proof of address (utility bill, bank statement not older than 3 months)
- Standard KYC review time: 24-72 hours after all documents submitted
- Do NOT ask customers to submit documents through chat — direct to the secure upload portal
- Never confirm or deny specific compliance decisions; explain process only
- Escalate: if account has been under review >5 business days, or if customer reports documents already submitted but status unchanged
- Never store, repeat back, or confirm specific document details provided in chat"""


def verification_agent(query: str, tenant_id: str) -> dict:
    try:
        client = _get_client()
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": query},
            ],
            temperature=0.3,
            max_tokens=512,
        )
        response = resp.choices[0].message.content or ""

        flagged = any(
            kw in query.lower()
            for kw in ("rejected", "banned", "closed", "suspended", "fraud", "aml")
        )

        return {"response": response, "flagged": flagged, "cache_hit": False}

    except Exception:
        return {
            "response": "I'm unable to check your verification status right now. Please try again shortly or contact support via email.",
            "flagged": False,
            "cache_hit": False,
        }
