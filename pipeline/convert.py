"""
Pulls APPROVED TrainingExamples from Neon, splits 70/30 replay/new,
writes data/train.jsonl and data/eval.jsonl.
"""

import asyncio
import json
import os
import random
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


async def fetch_examples(conn: asyncpg.Connection, agent_type: str | None = None) -> list:
    q = 'SELECT id, "agentType", query, response, "createdAt" FROM "TrainingExample" WHERE status = $1'
    args: list = ["APPROVED"]
    if agent_type:
        q += ' AND "agentType" = $2'
        args.append(agent_type)
    return await conn.fetch(q, *args)


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


async def main() -> bool:
    conn = await asyncpg.connect(os.environ["DATABASE_URL"])
    try:
        rows = await fetch_examples(conn)
        if not rows:
            print("⚠️  No APPROVED examples found — aborting convert")
            return False

        examples = [to_jsonl_row(r) for r in rows]
        random.shuffle(examples)

        # Temporal split: newest 30% = new, rest = replay buffer
        split_idx = int(len(examples) * (1 - CONFIG.replay_buffer_ratio))
        new_examples    = examples[:split_idx]
        replay_examples = examples[split_idx:]

        # Mix: 30% new + 70% replay, shuffle
        train_set = new_examples + replay_examples
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
    ok = asyncio.run(main())
    exit(0 if ok else 1)
