import re

# PII patterns for leak detection in response
_PII_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", re.IGNORECASE), "[EMAIL]"),
    (re.compile(r"\b\d{10,16}\b"), "[ACCOUNT_ID]"),
    (re.compile(r"\+?[\d\s\-().]{9,15}"), "[PHONE]"),
]

# Phrases that suggest fabricating account-specific data the agent couldn't know
_HALLUCINATION_SIGNALS = [
    r"your balance is",
    r"your account (shows|has|contains)",
    r"i (can see|see|found) (?:your|the) (transaction|deposit|withdrawal)",
    r"transaction id[:\s]+[A-Z0-9]{6,}",
    r"processed on \w+ \d+",
    r"your (deposit|withdrawal|transfer) of \$[\d,]+",
]
_HALLUCINATION_RE = re.compile("|".join(_HALLUCINATION_SIGNALS), re.IGNORECASE)

# Low-confidence indicators in response text
_UNCERTAIN_SIGNALS = [
    "i'm not sure",
    "i don't know",
    "i cannot confirm",
    "i am unable to verify",
    "i have no information",
    "no data available",
]


def _has_pii(text: str) -> bool:
    return any(pattern.search(text) for pattern, _ in _PII_PATTERNS)


def _redact_pii(text: str) -> str:
    result = text
    for pattern, replacement in _PII_PATTERNS:
        result = pattern.sub(replacement, result)
    return result


def _hallucination_risk(response: str) -> float:
    """0.0 = safe, 1.0 = high risk."""
    matches = len(_HALLUCINATION_RE.findall(response))
    return min(1.0, matches * 0.4)


def _confidence_score(response: str, agent_confidence: float) -> float:
    """Composite: router confidence + response uncertainty signals."""
    uncertain_count = sum(1 for sig in _UNCERTAIN_SIGNALS if sig in response.lower())
    penalty = min(0.3, uncertain_count * 0.1)
    return max(0.0, agent_confidence - penalty)


def check_output(response: str, agent_type: str, confidence: float) -> dict:
    """
    Returns dict with keys:
      - response: str (PII-scrubbed)
      - flagged: bool
      - flag_reason: str | None
      - confidence: float (adjusted)
      - hallucination_risk: float
    """
    pii_leaked = _has_pii(response)
    clean_response = _redact_pii(response) if pii_leaked else response

    hall_risk = _hallucination_risk(clean_response)
    adj_confidence = _confidence_score(clean_response, confidence)

    flagged = False
    flag_reason: str | None = None

    if pii_leaked:
        flagged = True
        flag_reason = "pii_leak_in_response"
    elif hall_risk >= 0.4:
        flagged = True
        flag_reason = "hallucination_risk"
    elif adj_confidence < 0.5:
        flagged = True
        flag_reason = "low_confidence"

    return {
        "response": clean_response,
        "flagged": flagged,
        "flag_reason": flag_reason,
        "confidence": adj_confidence,
        "hallucination_risk": hall_risk,
    }
