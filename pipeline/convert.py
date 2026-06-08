"""
Pulls APPROVED TrainingExamples from Neon, splits 70/30 replay/new,
writes data/train.jsonl and data/eval.jsonl.
"""

import asyncio
import json
import os
import random
import sys
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

from config import CONFIG

load_dotenv()

SYSTEM_PROMPT = (
    "You are AutoCSR, an AI customer service agent for an online betting platform. "
    "Answer only within your domain: deposits, withdrawals, KYC, onboarding, and general account queries. "
    "Be concise, accurate, and never fabricate account-specific data."
)


async def fetch_examples(
    conn: asyncpg.Connection,
    tenant_id: str | None = None,
    agent_type: str | None = None,
) -> list:
    q = '''
        SELECT id, "tenantId", "agentType", query, response, "createdAt"
        FROM "TrainingExample"
        WHERE status = $1
    '''
    args: list = ["APPROVED"]
    if tenant_id:
        q += ' AND "tenantId" = $2'
        args.append(tenant_id)
        if agent_type:
            q += ' AND "agentType" = $3'
            args.append(agent_type)
    elif agent_type:
        q += ' AND "agentType" = $2'
        args.append(agent_type)
    rows = await conn.fetch(q, *args)
    # Sort by createdAt ASC — temporal split requires sorted order
    return sorted(rows, key=lambda r: r["createdAt"])


def to_jsonl_row(row: asyncpg.Record) -> dict:
    return {
        "instruction": SYSTEM_PROMPT,
        "input":       row["query"],
        "output":      row["response"],
        "metadata": {
            "id":         str(row["id"]),
            "agent_type": row["agentType"],
            "created_at": row["createdAt"].isoformat(),
        },
    }


def _write_jsonl(path: str, rows: list) -> None:
    with open(path, "w") as f:
        for row in rows:
            f.write(json.dumps(row) + "\n")


async def main(tenant_id: str | None = None, agent_type: str | None = None) -> bool:
    conn = await asyncpg.connect(os.environ["DATABASE_URL"])
    try:
        rows = await fetch_examples(conn, tenant_id=tenant_id, agent_type=agent_type)
        if not rows:
            print("⚠️  No APPROVED examples found — aborting convert")
            return False

        # rows are sorted by createdAt ASC
        examples = [to_jsonl_row(r) for r in rows]

        # Temporal split: oldest 70% = replay buffer, newest 30% = new data
        split_idx       = int(len(examples) * CONFIG.replay_buffer_ratio)
        replay_examples = examples[:split_idx]
        new_examples    = examples[split_idx:]

        # Mix then shuffle — preserves temporal intent, removes ordering bias
        train_set = replay_examples + new_examples
        random.shuffle(train_set)

        # Hold out 10% for eval
        eval_idx  = max(1, int(len(train_set) * 0.1))
        eval_set  = train_set[:eval_idx]
        train_set = train_set[eval_idx:]

        Path(CONFIG.data_dir).mkdir(exist_ok=True)
        _write_jsonl(f"{CONFIG.data_dir}/train.jsonl", train_set)
        _write_jsonl(f"{CONFIG.data_dir}/eval.jsonl", eval_set)

        print(f"✅ convert: {len(train_set)} train, {len(eval_set)} eval examples")
        return True
    finally:
        await conn.close()


if __name__ == "__main__":
    _tenant_id  = os.getenv("PIPELINE_TENANT_ID") or (sys.argv[2] if len(sys.argv) > 2 else None)
    _agent_type = sys.argv[1] if len(sys.argv) > 1 else None
    ok = asyncio.run(main(tenant_id=_tenant_id, agent_type=_agent_type))
    sys.exit(0 if ok else 1)
