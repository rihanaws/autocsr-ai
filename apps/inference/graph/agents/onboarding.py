import os

from openai import OpenAI

from cache.semantic import retrieve_knowledge

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


SYSTEM_PROMPT = """You are a specialized CSR agent for an online betting platform handling new account onboarding.
You help with: account registration, signup errors, email verification, welcome bonus activation, first deposit flow, and initial account setup questions.

Guidelines:
- Be warm, clear, and encouraging — this is the customer's first impression
- Registration steps: create account → verify email → complete profile → submit KYC documents → make first deposit
- Welcome bonus eligibility: typically requires first deposit meeting minimum threshold; exact amounts are platform-defined
- Bonus activation: usually automatic on qualifying first deposit, but can take up to 1 hour to credit
- Direct registration issues (form errors, email not received) to specific troubleshooting steps
- For email verification issues: check spam folder, allow 5 minutes, then request resend
- Never promise specific bonus amounts — describe process only
- Escalate: if account creation blocked after multiple attempts, or if identity pre-check fails"""


def onboarding_agent(query: str, tenant_id: str) -> dict:
    try:
        client = _get_client()
        kb_chunks = retrieve_knowledge(query, tenant_id)
        kb_context = ""
        if kb_chunks:
            kb_context = (
                "\n\nRelevant knowledge base context:\n"
                + "\n---\n".join(kb_chunks)
            )
        full_system = SYSTEM_PROMPT + kb_context
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": full_system},
                {"role": "user", "content": query},
            ],
            temperature=0.4,
            max_tokens=512,
        )
        response = resp.choices[0].message.content or ""

        flagged = any(
            kw in query.lower()
            for kw in (
                "duplicate account",
                "multiple accounts",
                "banned",
                "blocked",
                "underage",
            )
        )

        return {"response": response, "flagged": flagged, "cache_hit": False}

    except Exception:
        return {
            "response": "I'm unable to assist with account setup right now. Please try again shortly or visit our help center.",
            "flagged": False,
            "cache_hit": False,
        }
