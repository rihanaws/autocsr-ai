"""
Full pipeline: convert → finetune → evaluate → promote.
Called by QStash webhook. Accepts training_run_id and agent_type as args.
"""

import asyncio
import json
import os
import subprocess
import sys

import asyncpg
from dotenv import load_dotenv

load_dotenv()


async def update_run(conn: asyncpg.Connection, run_id: str, status: str, error: str | None = None) -> None:
    await conn.execute(
        'UPDATE "TrainingRun" SET status = $1, error = $2 WHERE id = $3',
        status, error, run_id,
    )


async def main(training_run_id: str, agent_type: str) -> None:
    conn = await asyncpg.connect(os.environ["DATABASE_URL"])
    try:
        await update_run(conn, training_run_id, "RUNNING")

        # Step 1: convert
        r = subprocess.run(["python", "convert.py"], capture_output=True, text=True, cwd=os.path.dirname(__file__))
        if r.returncode != 0:
            await update_run(conn, training_run_id, "FAILED", r.stderr)
            return

        # Step 2: finetune — outputs adapter_path as last JSON line on stdout
        await update_run(conn, training_run_id, "TRAINING")
        r = subprocess.run(
            ["python", "finetune.py", agent_type],
            capture_output=True, text=True, cwd=os.path.dirname(__file__),
        )
        if r.returncode != 0:
            await update_run(conn, training_run_id, "FAILED", r.stderr)
            return
        adapter_path = json.loads(r.stdout.strip().split("\n")[-1])["adapter_path"]

        # Step 3: evaluate
        await update_run(conn, training_run_id, "EVALUATING")
        r = subprocess.run(
            ["python", "evaluate.py", adapter_path],
            capture_output=True, text=True, cwd=os.path.dirname(__file__),
        )
        if not r.stdout.strip():
            await update_run(conn, training_run_id, "FAILED", r.stderr or "evaluate.py produced no output")
            return
        eval_result = json.loads(r.stdout.strip().split("\n")[-1])

        # Step 4: promote
        await conn.execute(
            'UPDATE "TrainingRun" SET status = $1, "evalAccuracy" = $2, "adapterPath" = $3, "completedAt" = NOW() WHERE id = $4',
            "PROMOTED" if eval_result["passed"] else "REJECTED",
            eval_result["bleu"],
            adapter_path,
            training_run_id,
        )
        print(f"✅ pipeline complete: {eval_result}")
    except Exception as e:
        await update_run(conn, training_run_id, "FAILED", str(e))
        raise
    finally:
        await conn.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_pipeline.py <training_run_id> [agent_type]")
        sys.exit(1)
    asyncio.run(main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "general"))
