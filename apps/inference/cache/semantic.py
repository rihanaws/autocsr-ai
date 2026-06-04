import hashlib
import json
import os
import re

from upstash_vector import Index

_TENANT_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")

SIMILARITY_THRESHOLD = float(os.getenv("SEMANTIC_CACHE_THRESHOLD", "0.92"))

_index: Index | None = None


def _get_index() -> Index:
    global _index
    if _index is None:
        _index = Index(
            url=os.environ["UPSTASH_VECTOR_REST_URL"],
            token=os.environ["UPSTASH_VECTOR_REST_TOKEN"],
        )
    return _index


def _make_id(tenant_id: str, query: str) -> str:
    key = f"{tenant_id}:{query.strip().lower()}"
    return hashlib.sha256(key.encode()).hexdigest()[:32]


def _validate_tenant_id(tenant_id: str) -> None:
    if not _TENANT_ID_RE.fullmatch(tenant_id):
        raise ValueError(f"Invalid tenant_id: {tenant_id!r}")


def lookup(query: str, tenant_id: str) -> dict | None:
    """Return cached response dict or None on miss."""
    try:
        _validate_tenant_id(tenant_id)
        index = _get_index()
        results = index.query(
            data=query,
            top_k=1,
            include_metadata=True,
            filter=f'tenant_id = "{tenant_id}"',
        )
        if not results:
            return None
        top = results[0]
        # Double-check returned record belongs to caller — guards against filter bypass
        if (
            top.score >= SIMILARITY_THRESHOLD
            and top.metadata
            and top.metadata.get("tenant_id") == tenant_id
        ):
            return json.loads(top.metadata.get("payload", "null"))
        return None
    except ValueError:
        raise
    except Exception:
        return None


def write(query: str, tenant_id: str, response_payload: dict) -> None:
    """Upsert query + response into vector cache."""
    try:
        _validate_tenant_id(tenant_id)
        index = _get_index()
        vector_id = _make_id(tenant_id, query)
        index.upsert(
            vectors=[
                {
                    "id": vector_id,
                    "data": query,
                    "metadata": {
                        "tenant_id": tenant_id,
                        "payload": json.dumps(response_payload),
                    },
                }
            ]
        )
    except Exception:
        pass
