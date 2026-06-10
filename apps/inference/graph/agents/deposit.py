import os

from openai import OpenAI

from cache.semantic import retrieve_knowledge

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


SYSTEM_PROMPT = """You are a specialized CSR agent for an online betting platform handling deposit issues.
You help with: failed deposits, pending payments, balance not credited, payment method problems.

Guidelines:
- Be concise and professional
- Ask for transaction ID or reference number when relevant
- Standard resolution times: bank transfers 1-3 days, e-wallets instant-2 hours
- Escalate if deposit over $10,000 or flagged for compliance
- Never promise specific amounts or override limits"""


def deposit_agent(query: str, tenant_id: str) -> dict:
    try:
        client = _get_client()
        kb_chunks = retrieve_knowledge(query, tenant_id)
        kb_context = ""
        if kb_chunks:
            kb_context = "\n\nRelevant knowledge base context:\n" + "\n---\n".join(
                kb_chunks
            )
        full_system = SYSTEM_PROMPT + kb_context
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": full_system},
                {"role": "user", "content": query},
            ],
            temperature=0.3,
            max_tokens=512,
        )
        response = resp.choices[0].message.content or ""

        flagged = any(
            kw in query.lower()
            for kw in ("fraud", "chargeback", "dispute", "stolen", "scam")
        )

        return {"response": response, "flagged": flagged, "cache_hit": False}

    except Exception:
        return {
            "response": "I'm unable to process your deposit inquiry right now. Please try again shortly.",
            "flagged": False,
            "cache_hit": False,
        }
