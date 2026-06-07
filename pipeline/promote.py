"""
Updates TrainingRun in Neon: PROMOTED or REJECTED based on eval result.
"""

import asyncio
import json
import os
import sys

import asyncpg
from dotenv import load_dotenv

load_dotenv()


async def promote(training_run_id: str, eval_result: dict) -> None:
    conn = await asyncpg.connect(os.environ["DATABASE_URL"])
    try:
        status = "PROMOTED" if eval_result["passed"] else "REJECTED"
        await conn.execute(
            '''
            UPDATE "TrainingRun"
            SET status = $1,
                "evalAccuracy" = $2,
                "adapterPath" = $3,
                "completedAt" = NOW()
            WHERE id = $4
            ''',
            status,
            eval_result["bleu"],
            eval_result["adapter_path"],
            training_run_id,
        )
        print(f"✅ TrainingRun {training_run_id} → {status} (BLEU: {eval_result['bleu']})")
    finally:
        await conn.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python promote.py <training_run_id> <eval_result_json>")
        sys.exit(1)
    asyncio.run(promote(sys.argv[1], json.loads(sys.argv[2])))
