---
paths:
  - "apps/inference/**/*.py"
  - "pipeline/**/*.py"
---
# Python Rules

- Python 3.11+. Type hints on all function signatures.
- FastAPI: async handlers only. Pydantic v2 for request/response models.
- LangGraph: all nodes are async functions. State is AgentState TypedDict.
- DB writes from Python: asyncpg only. Never Prisma (Node-only).
- Environment variables: load via python-dotenv or os.environ. Never hardcode.
- After ANY Python edit: check for syntax errors before stopping.
