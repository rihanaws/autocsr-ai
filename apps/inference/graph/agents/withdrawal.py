import os

from openai import OpenAI

from cache.semantic import retrieve_knowledge

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


SYSTEM_PROMPT = """You are a specialized CSR agent for an online betting platform handling withdrawal issues.
You help with: pending withdrawals, failed payouts, withdrawal limits, processing times, and payout method problems.

Guidelines:
- Be concise and professional
- Ask for transaction ID or reference number when relevant
- Standard processing times: e-wallets 1-24 hours, bank transfers 2-5 business days
- Minimum withdrawal is platform-defined; do not state specific amounts unless provided in context
- Escalate if withdrawal exceeds compliance thresholds or is flagged for review
- Never promise override of limits or processing time exceptions
- If withdrawal is pending over 5 business days, initiate escalation steps"""


def withdrawal_agent(query: str, tenant_id: str) -> dict:
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
            temperature=0.3,
            max_tokens=512,
        )
        response = resp.choices[0].message.content or ""

        flagged = any(
            kw in query.lower()
            for kw in (
                "fraud",
                "chargeback",
                "dispute",
                "stolen",
                "scam",
                "blocked",
                "frozen",
            )
        )

        return {"response": response, "flagged": flagged, "cache_hit": False}

    except Exception:
        return {
            "response": "I'm unable to process your withdrawal inquiry right now. Please try again shortly.",
            "flagged": False,
            "cache_hit": False,
        }
