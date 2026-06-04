import re

# PII patterns — redact before passing to agents
_PII_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", re.IGNORECASE), "[EMAIL]"),
    (re.compile(r"\b\d{10,16}\b"), "[ACCOUNT_ID]"),
    (re.compile(r"\+?[\d\s\-().]{9,15}"), "[PHONE]"),
]

# Keywords that indicate a CSR-relevant query — at least one must match for scope pass
_CSR_KEYWORDS = {
    "deposit",
    "withdrawal",
    "withdraw",
    "payment",
    "transfer",
    "balance",
    "account",
    "verification",
    "kyc",
    "document",
    "id",
    "identity",
    "bonus",
    "promotion",
    "register",
    "signup",
    "login",
    "password",
    "transaction",
    "pending",
    "processing",
    "refund",
    "limit",
    "bet",
    "wager",
    "odds",
    "game",
    "sport",
    "casino",
    "slot",
    "support",
    "help",
    "issue",
    "problem",
    "error",
    "failed",
    "credit",
    "debit",
    "e-wallet",
    "bank",
    "card",
}

_OUT_OF_SCOPE_RESPONSE = (
    "I'm only able to assist with customer service inquiries related to your "
    "betting account, deposits, withdrawals, and verification. For other topics, "
    "please contact us via our main support channels."
)


def _redact_pii(text: str) -> str:
    result = text
    for pattern, replacement in _PII_PATTERNS:
        result = pattern.sub(replacement, result)
    return result


def _has_pii(text: str) -> bool:
    return any(pattern.search(text) for pattern, _ in _PII_PATTERNS)


def _is_csr_relevant(query: str) -> bool:
    lowered = query.lower()
    return any(kw in lowered for kw in _CSR_KEYWORDS)


def check_input(query: str, tenant_id: str) -> dict:
    """
    Returns dict with keys:
      - passed: bool
      - query: str (redacted if PII found)
      - response: str | None (set if rejected)
      - pii_detected: bool
    """
    if not _is_csr_relevant(query):
        return {
            "passed": False,
            "query": query,
            "response": _OUT_OF_SCOPE_RESPONSE,
            "pii_detected": False,
        }

    pii_found = _has_pii(query)
    clean_query = _redact_pii(query) if pii_found else query

    return {
        "passed": True,
        "query": clean_query,
        "response": None,
        "pii_detected": pii_found,
    }
