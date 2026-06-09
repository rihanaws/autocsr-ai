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


def retrieve_knowledge(
    query_text: str,
    tenant_id:  str,
    top_k:      int   = 3,
    min_score:  float = 0.72,
) -> list[str]:
    """
    Sync — safe to call from sync LangGraph agent nodes.
    Uses data= (text) query — index auto-embeds, no external call needed.
    Returns empty list on any failure — never breaks inference.
    """
    try:
        _validate_tenant_id(tenant_id)
        index = _get_index()
        results = index.query(
            data=query_text,
            top_k=top_k,
            filter=f'type = "knowledge" AND tenant_id = "{tenant_id}"',
            include_metadata=True,
        )
        # Double-check returned records belong to caller — guards against filter bypass
        return [
            r.metadata["content"]
            for r in results
            if r.score >= min_score
            and r.metadata
            and r.metadata.get("content")
            and r.metadata.get("tenant_id") == tenant_id
            and r.metadata.get("type") == "knowledge"
        ]
    except Exception as e:
        print(f"[knowledge/retrieve] error: {e}")
        return []


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
    except Exception as e:
        print(f"[semantic_cache] write failed: {type(e).__name__}: {e}", flush=True)
