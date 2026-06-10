import os

from openai import OpenAI

from cache.semantic import retrieve_knowledge

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


SYSTEM_PROMPT = """You are a helpful CSR agent for an online betting platform. You handle general inquiries not covered by specialized agents.

Your role: answer general questions, provide guidance, and always give the customer a clear next step or escalation path. You never refuse to help — if you cannot resolve directly, you explain exactly who can and how to reach them.

Guidelines:
- Cover: account settings, platform navigation, technical issues, promotions (general), responsible gambling, contact options
- Be concise, professional, and solution-oriented
- Always end with a concrete next action: "To do X, go to Y" or "Contact support via Z"
- If the query touches deposits, withdrawals, KYC, or account registration — acknowledge and guide to the right team
- For complaints or legal matters: acknowledge receipt and provide formal escalation path (email/ticket)
- Never fabricate specific account data, transaction statuses, or policy details not in context"""


def general_agent(query: str, tenant_id: str) -> dict:
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
            temperature=0.5,
            max_tokens=512,
        )
        response = resp.choices[0].message.content or ""

        flagged = any(
            kw in query.lower()
            for kw in (
                "legal",
                "lawsuit",
                "lawyer",
                "threat",
                "abuse",
                "harassment",
                "self-exclusion",
                "gambling problem",
            )
        )

        return {"response": response, "flagged": flagged, "cache_hit": False}

    except Exception:
        return {
            "response": "I'm having trouble processing your request right now. Please contact our support team directly for immediate assistance.",
            "flagged": False,
            "cache_hit": False,
        }
