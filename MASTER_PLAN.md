# OKBET CSR AI — Master Architecture & Execution Plan v2
**Project:** AutoCSR — AI-Native Customer Service Automation for Online Betting  
**Owner:** TechSci, Inc. / Sayem Abdullah Rihan  
**Runtime Stack:** Bun · Next.js 15 · TypeScript strict · Neon (PostgreSQL) · Upstash Redis · Python (LangGraph + Unsloth)  
**UI Stack:** Shadcn/ui · Tailwind CSS v4 · Framer Motion  
**Effective Date:** June 2, 2026  

---

## BRUTAL FEASIBILITY ASSESSMENT (Read This First)

### What You're Actually Building
You described 6 separate systems in one breath. Let's name them honestly:

| System | What It Is | Feasibility | Cost Reality |
|--------|-----------|-------------|-------------|
| Multi-agent orchestration | LangGraph router + 4–5 specialized LoRA adapters | ✅ High | $0 (open-source) |
| Semantic cache | Upstash Vector similarity search before LLM call | ✅ High | ~$0 at MVP scale |
| Continuous learning loop | Weekly automated QLoRA fine-tune | ✅ Medium | ~$8–15/week GPU |
| LLM Auditor / Judge | Async Claude Haiku sampling responses | ✅ High | ~$2–5/month |
| Guard layer (input/output) | Small classifier before/after LLM | ✅ High | $0 (local model) |
| SaaS platform + landing page | Next.js 15 multi-tenant product | ✅ High | ~$20/month infra |

**Bootstrapped monthly cost at MVP:** $25–60/month total. Viable at $0 starting capital if you use free tiers correctly.

### The One Thing That Will Kill You If You Get It Wrong
**The continuous learning loop.** "Learn every day" sounds right but will cause **catastrophic forgetting** — the model gradually forgets earlier patterns as it overfits to recent data. The correct architecture is:

- Cache layer handles "instant learning" for repeated patterns (no model retraining needed)
- Model fine-tuning runs **weekly**, not daily, on a **mixed dataset** (30% new + 70% replay buffer)
- Daily "learning" = cache population, NOT model retraining
- Model retrain only when holdout accuracy starts degrading OR you hit 500+ new quality examples

This distinction saves you money, time, and model quality. Daily GPU runs will bankrupt a bootstrapped project.

### Multi-Agent: Right Idea, Right Sizing Matters
5 separate model instances = 5× GPU RAM. **Wrong approach.**

**Correct approach:** One base Hermes-3 8B + N lightweight LoRA adapters (each ~80MB). The router loads the appropriate adapter dynamically. Same GPU, same base model, specialized behavior per domain. Cost: near-zero marginal.

---

## SYSTEM ARCHITECTURE OVERVIEW

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         AUTOCSR PLATFORM                                      │
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                    NEXT.JS 15 LAYER (Vercel)                            │  │
│  │  Landing Page · Auth (NextAuth v5) · Tenant Dashboard · API Routes      │  │
│  └──────────────────────────┬──────────────────────────────────────────────┘  │
│                             │ HTTP / WebSocket                                 │
│  ┌──────────────────────────▼──────────────────────────────────────────────┐  │
│  │                   ORCHESTRATION LAYER (Python/FastAPI)                   │  │
│  │                                                                          │  │
│  │  ┌─────────────┐    ┌──────────────────────────────────────────────┐   │  │
│  │  │ INPUT GUARD │───▶│           SEMANTIC CACHE                      │   │  │
│  │  │ (scope +    │    │  Upstash Vector · cosine ≥ 0.92 → HIT        │   │  │
│  │  │  PII check) │    │  Cache HIT: return instantly, zero LLM cost   │   │  │
│  │  └─────────────┘    └──────────────────┬───────────────────────────┘   │  │
│  │                                        │ MISS                          │  │
│  │                         ┌──────────────▼───────────────┐               │  │
│  │                         │      ROUTER AGENT             │               │  │
│  │                         │  GPT-4o-mini / fine-tuned     │               │  │
│  │                         │  classifier → route intent    │               │  │
│  │                         └──────────────┬───────────────┘               │  │
│  │                                        │                               │  │
│  │            ┌──────────────┬────────────┼─────────────┬──────────────┐  │  │
│  │            ▼              ▼            ▼             ▼              ▼  │  │
│  │       ┌────────┐   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│  │
│  │       │DEPOSIT │   │WITHDRAWAL│ │   KYC /  │ │ONBOARDING│ │ GENERAL  ││  │
│  │       │ AGENT  │   │  AGENT   │ │  VERIFY  │ │  AGENT   │ │  AGENT   ││  │
│  │       │LoRA-01 │   │ LoRA-02  │ │ AGENT    │ │ LoRA-04  │ │ LoRA-05  ││  │
│  │       │        │   │          │ │ LoRA-03  │ │          │ │          ││  │
│  │       └────┬───┘   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘│  │
│  │            └────────────┴────────────┴─────────────┴────────────┘     │  │
│  │                                        │                               │  │
│  │                         ┌──────────────▼──────────────┐               │  │
│  │                         │      OUTPUT GUARD            │               │  │
│  │                         │  Hallucination check         │               │  │
│  │                         │  PII leak detection          │               │  │
│  │                         │  Confidence scoring          │               │  │
│  │                         └──────────────┬──────────────┘               │  │
│  │                                        │                               │  │
│  │                         ┌──────────────▼──────────────┐               │  │
│  │                         │      CACHE WRITER            │               │  │
│  │                         │  Embed + store in Upstash    │               │  │
│  │                         │  TTL: 7d common / 24h edge   │               │  │
│  │                         └──────────────┬──────────────┘               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                             │                                                │
│  ┌──────────────────────────▼──────────────────────────────────────────────┐  │
│  │                    ASYNC LAYER (background jobs)                         │  │
│  │                                                                          │  │
│  │  ┌────────────────────┐    ┌──────────────────┐    ┌─────────────────┐  │  │
│  │  │   LLM AUDITOR      │    │  LEARNING LOOP   │    │  HUMAN REVIEW   │  │  │
│  │  │  Claude Haiku      │    │  Weekly QLoRA    │    │  Queue (flagged │  │  │
│  │  │  samples 5% of     │    │  fine-tune run   │    │  responses)     │  │  │
│  │  │  responses async   │    │  mixed dataset   │    │                 │  │  │
│  │  │  flags low quality │    │  auto-promote or │    │  Dashboard UI   │  │  │
│  │  │  to review queue   │    │  reject adapter  │    │  for agents     │  │  │
│  │  └────────────────────┘    └──────────────────┘    └─────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                    DATA LAYER                                             │  │
│  │  Neon PostgreSQL (Prisma) · pgvector · Upstash Redis · Upstash Vector    │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## COMPLETE TECH STACK

### Runtime & Build
| Layer | Choice | Why |
|-------|--------|-----|
| Package manager | **Bun** | 3–10× faster installs/runs vs npm, native TS |
| Frontend framework | **Next.js 15** (App Router, no src/) | RSC + streaming, Vercel-native |
| Language | **TypeScript 5.x strict** | Non-negotiable |
| UI components | **Shadcn/ui** (latest) | Unstyled, composable, own your components |
| Styling | **Tailwind CSS v4** | CSS-first config, @theme directive, no config file |
| Animation | **Motion (Framer)** | Production-grade, React-native |
| AI SDK | **Vercel AI SDK v4** | Streaming, multi-provider, Next.js native |

### Backend
| Layer | Choice | Why |
|-------|--------|-----|
| Inference service | **FastAPI** (Python 3.11) | Async, typed, LangGraph-native |
| Agent orchestration | **LangGraph** | Stateful graph, best for multi-agent routing |
| Model serving | **Ollama** (local dev) / **Together.ai** (prod) | Together.ai serves Hermes-3 at $0.18/1M tokens |
| Embeddings | **nomic-embed-text** via Ollama | Free, 768-dim, fast |

### Data
| Layer | Choice | Why |
|-------|--------|-----|
| Primary DB | **Neon** (serverless PostgreSQL) | Branch-per-PR, scale-to-zero, pgvector built-in |
| ORM | **Prisma 6** | Type-safe, Neon adapter, migrations |
| Vector search | **pgvector** on Neon | Knowledge base RAG (persistent) |
| Cache | **Upstash Redis** | Serverless Redis, Vercel Edge-compatible |
| Semantic cache | **Upstash Vector** | Dedicated vector index, free tier 10K queries/day |
| Queue | **Upstash QStash** | HTTP-based queue for async auditor/training jobs |

### Auth & Billing
| Layer | Choice |
|-------|--------|
| Auth | NextAuth.js v5 (App Router native) |
| Billing | Stripe (subscriptions + usage metering) |
| Email | Resend |

### DevOps
| Layer | Choice |
|-------|--------|
| Frontend hosting | Vercel |
| Inference hosting | Railway (Python service, $5/month Starter) |
| Extension build | Vite + @crxjs/vite-plugin (Bun-compatible) |
| CI/CD | GitHub Actions |

---

## REPO STRUCTURE

```
autocsr/
├── apps/
│   ├── web/                          ← Next.js 15 SaaS platform
│   │   ├── app/
│   │   │   ├── (marketing)/          ← Landing, pricing, blog
│   │   │   │   ├── page.tsx          ← Landing page
│   │   │   │   ├── pricing/
│   │   │   │   └── layout.tsx
│   │   │   ├── (auth)/               ← Login, register
│   │   │   ├── (dashboard)/          ← Tenant dashboard
│   │   │   │   ├── analytics/
│   │   │   │   ├── agents/           ← Agent status + config
│   │   │   │   ├── review-queue/     ← Human review UI
│   │   │   │   ├── training/         ← Training run status
│   │   │   │   └── settings/
│   │   │   └── api/
│   │   │       ├── chat/route.ts     ← Main inference endpoint
│   │   │       ├── webhook/route.ts  ← LiveAgent webhook
│   │   │       └── stripe/route.ts
│   │   ├── components/
│   │   │   ├── ui/                   ← Shadcn components
│   │   │   ├── marketing/            ← Landing page sections
│   │   │   └── dashboard/            ← Dashboard widgets
│   │   ├── lib/
│   │   │   ├── db.ts                 ← Prisma client (Neon)
│   │   │   ├── redis.ts              ← Upstash Redis client
│   │   │   ├── vector.ts             ← Upstash Vector client
│   │   │   └── auth.ts               ← NextAuth config
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── package.json
│   │   └── bunfig.toml
│   │
│   └── inference/                    ← Python FastAPI + LangGraph
│       ├── main.py                   ← FastAPI app entry
│       ├── graph/
│       │   ├── router.py             ← Intent classifier node
│       │   ├── agents/
│       │   │   ├── deposit.py
│       │   │   ├── withdrawal.py
│       │   │   ├── verification.py
│       │   │   ├── onboarding.py
│       │   │   └── general.py
│       │   ├── guards/
│       │   │   ├── input_guard.py
│       │   │   └── output_guard.py
│       │   └── workflow.py           ← LangGraph StateGraph definition
│       ├── cache/
│       │   └── semantic.py           ← Upstash Vector cache layer
│       ├── auditor/
│       │   └── judge.py              ← Claude Haiku async judge
│       ├── learning/
│       │   ├── collector.py          ← Session ingestion + scoring
│       │   ├── scheduler.py          ← Weekly fine-tune trigger (QStash)
│       │   └── trainer.py            ← Unsloth fine-tune runner
│       └── requirements.txt
│
├── packages/
│   └── extension/                    ← Chrome MV3 scraper
│       ├── src/
│       │   ├── background/service-worker.ts
│       │   ├── content/
│       │   │   ├── observer.ts
│       │   │   ├── extractor.ts
│       │   │   ├── anonymizer.ts
│       │   │   └── media-capture.ts
│       │   ├── crypto/vault.ts
│       │   ├── popup/
│       │   └── lib/
│       │       ├── schema.ts
│       │       └── xml-formatter.ts
│       ├── manifest.json
│       ├── package.json
│       └── vite.config.ts
│
├── pipeline/                         ← Standalone Python training scripts
│   ├── convert.py
│   ├── quality_score.py
│   ├── finetune.py
│   └── evaluate.py
│
├── bun.lockb
├── package.json                      ← Bun workspace root
└── turbo.json                        ← Turborepo (optional, add later)
```

### Root package.json (Bun workspaces)
```json
{
  "name": "autocsr",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "bun run --filter=web dev",
    "build": "bun run --filter=web build",
    "ext:build": "bun run --filter=extension build",
    "db:push": "bun run --filter=web db:push",
    "db:studio": "bun run --filter=web db:studio"
  }
}
```

---

## DATABASE SCHEMA (Neon + Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

model Tenant {
  id           String   @id @default(cuid())
  name         String
  slug         String   @unique
  tier         Tier     @default(FREE)
  apiKey       String   @unique @default(dbgenerated("encode(gen_random_bytes(32), 'hex')"))
  stripeCustomerId String?
  stripeSubId  String?
  createdAt    DateTime @default(now())

  queryEvents  QueryEvent[]
  knowledgeChunks KnowledgeChunk[]
  reviewQueue  ReviewItem[]
  trainingRuns TrainingRun[]
}

enum Tier {
  FREE       // 500 queries/mo
  STARTER    // 10K queries/mo — $149
  GROWTH     // 50K queries/mo — $499
  ENTERPRISE // unlimited — custom
}

model QueryEvent {
  id             String   @id @default(cuid())
  tenantId       String
  tenant         Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  queryHash      String   // SHA-256 of query for dedup
  queryText      String   // anonymized
  responseText   String
  agentType      AgentType
  cacheHit       Boolean  @default(false)
  resolved       Boolean  @default(false)
  confidenceScore Float?
  resolutionMs   Int?
  modelVersion   String
  auditorScore   Float?   // set async by LLM judge
  flaggedForReview Boolean @default(false)
  createdAt      DateTime @default(now())

  @@index([tenantId, createdAt])
  @@index([tenantId, agentType])
}

enum AgentType {
  DEPOSIT
  WITHDRAWAL
  VERIFICATION
  ONBOARDING
  GENERAL
}

model KnowledgeChunk {
  id        String                   @id @default(cuid())
  tenantId  String
  tenant    Tenant                   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  content   String
  embedding Unsupported("vector(768)")?
  source    String                   // faq | policy | escalation_guide | resolved_case
  agentType AgentType?
  createdAt DateTime                 @default(now())

  @@index([tenantId])
}

model ReviewItem {
  id           String      @id @default(cuid())
  tenantId     String
  tenant       Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  queryText    String
  responseText String
  agentType    AgentType
  auditReason  String      // why flagged: low_confidence | hallucination_risk | pii_leak
  auditScore   Float
  status       ReviewStatus @default(PENDING)
  reviewedBy   String?
  reviewedAt   DateTime?
  correction   String?     // human-corrected response (goes back into training pool)
  createdAt    DateTime    @default(now())

  @@index([tenantId, status])
}

enum ReviewStatus {
  PENDING
  APPROVED
  CORRECTED
  REJECTED
}

model TrainingRun {
  id              String        @id @default(cuid())
  tenantId        String
  tenant          Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  status          TrainingStatus @default(QUEUED)
  examplesUsed    Int?
  baseModelVersion String
  adapterVersion  String?
  evalAccuracy    Float?        // holdout accuracy after run
  evalDelta       Float?        // improvement vs previous adapter
  promoted        Boolean       @default(false)
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime      @default(now())
}

enum TrainingStatus {
  QUEUED
  RUNNING
  EVALUATING
  PROMOTED
  REJECTED
  FAILED
}

// Pending training pool — dequeued on weekly training run
model TrainingExample {
  id           String    @id @default(cuid())
  tenantId     String
  queryText    String
  responseText String
  agentType    AgentType
  qualityScore Float
  sessionId    String?
  used         Boolean   @default(false)
  createdAt    DateTime  @default(now())

  @@index([tenantId, used, qualityScore])
}
```

---

## SEMANTIC CACHE LAYER

### How It Works
```
New query arrives
       │
       ▼
Embed with nomic-embed-text (768-dim vector)
       │
       ▼
Upstash Vector: search top-3 similar (cosine distance)
       │
similarity ≥ 0.92? ──YES──► Return cached response
       │                     Log as cache HIT in QueryEvent
       NO
       │
       ▼
Route to LangGraph agent
       │
       ▼
Generate response
       │
       ▼
Store in Upstash Vector:
  - key: sha256(query)
  - vector: query embedding
  - metadata: { response, agentType, tenantId, qualityScore, ts }
  - TTL: 604800s (7 days) for common patterns
         86400s (24h) for edge/low-confidence responses
```

### cache/semantic.py
```python
from upstash_vector import Index
import hashlib, time

index = Index(url=UPSTASH_VECTOR_URL, token=UPSTASH_VECTOR_TOKEN)

SIMILARITY_THRESHOLD = 0.92

async def cache_lookup(query: str, tenant_id: str, embedding: list[float]) -> dict | None:
    results = index.query(
        vector=embedding,
        top_k=1,
        filter=f'tenant_id = "{tenant_id}"',
        include_metadata=True
    )
    if results and results[0].score >= SIMILARITY_THRESHOLD:
        return {
            "hit": True,
            "response": results[0].metadata["response"],
            "agent_type": results[0].metadata["agent_type"],
            "cached_at": results[0].metadata["ts"]
        }
    return None

async def cache_write(query: str, response: str, tenant_id: str,
                      embedding: list[float], agent_type: str,
                      quality_score: float):
    ttl = 604800 if quality_score >= 0.80 else 86400
    index.upsert(
        id=hashlib.sha256(f"{tenant_id}:{query}".encode()).hexdigest(),
        vector=embedding,
        metadata={
            "response": response,
            "agent_type": agent_type,
            "tenant_id": tenant_id,
            "quality_score": quality_score,
            "ts": int(time.time())
        }
    )
```

**Expected cache hit rate for CSR deposit queries: 55–70% after 2 weeks of operation.**  
This means 55–70% of queries cost $0 in LLM calls. At scale, this is your biggest cost lever.

---

## MULTI-AGENT ORCHESTRATION (LangGraph)

### graph/workflow.py — State Graph
```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Literal
from graph.router import classify_intent
from graph.guards.input_guard import check_input
from graph.guards.output_guard import check_output
from graph.agents import deposit, withdrawal, verification, onboarding, general
from cache.semantic import cache_lookup, cache_write

class AgentState(TypedDict):
    query: str
    tenant_id: str
    embedding: list[float]
    intent: Literal["deposit","withdrawal","verification","onboarding","general"] | None
    response: str | None
    cache_hit: bool
    confidence: float
    guard_passed: bool
    flagged: bool
    flag_reason: str | None

def build_graph():
    g = StateGraph(AgentState)

    g.add_node("input_guard",    check_input)
    g.add_node("cache_check",    cache_check_node)
    g.add_node("router",         classify_intent)
    g.add_node("deposit",        deposit.run)
    g.add_node("withdrawal",     withdrawal.run)
    g.add_node("verification",   verification.run)
    g.add_node("onboarding",     onboarding.run)
    g.add_node("general",        general.run)
    g.add_node("output_guard",   check_output)
    g.add_node("cache_write",    cache_write_node)

    g.set_entry_point("input_guard")
    g.add_edge("input_guard", "cache_check")

    # Cache hit → skip everything → output guard
    g.add_conditional_edges("cache_check", lambda s: "hit" if s["cache_hit"] else "miss", {
        "hit":  "output_guard",
        "miss": "router"
    })

    # Route to specialized agent
    g.add_conditional_edges("router", lambda s: s["intent"], {
        "deposit":      "deposit",
        "withdrawal":   "withdrawal",
        "verification": "verification",
        "onboarding":   "onboarding",
        "general":      "general"
    })

    # All agents → output guard
    for agent in ["deposit","withdrawal","verification","onboarding","general"]:
        g.add_edge(agent, "output_guard")

    # Output guard → cache write → END
    g.add_edge("output_guard", "cache_write")
    g.add_edge("cache_write", END)

    return g.compile()
```

### Router: Intent Classification
**Option A (free):** Fine-tuned small classifier (Llama 3.2 1B, zero cost after training)  
**Option B (cheap, use for MVP):** GPT-4o-mini with structured output — $0.00015 per classification  
**Decision:** Use GPT-4o-mini for MVP (costs ~$0.50/month at 10K queries/month). Train your own classifier once you have 1,000+ labeled examples.

```python
# graph/router.py
from openai import AsyncOpenAI
from pydantic import BaseModel
from typing import Literal

client = AsyncOpenAI()

class IntentResult(BaseModel):
    intent: Literal["deposit","withdrawal","verification","onboarding","general"]
    confidence: float  # 0.0–1.0

ROUTER_SYSTEM = """Classify the customer service query into exactly one category:
- deposit: failed deposits, pending payments, deposit limits, payment methods, balance not credited
- withdrawal: withdrawal requests, pending withdrawals, withdrawal limits
- verification: KYC, identity verification, document upload, account verification
- onboarding: new account, registration, welcome bonuses, first deposit
- general: everything else

Respond with JSON only."""

async def classify_intent(state: AgentState) -> AgentState:
    result = await client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": ROUTER_SYSTEM},
            {"role": "user", "content": state["query"]}
        ],
        response_format=IntentResult
    )
    state["intent"] = result.choices[0].message.parsed.intent
    state["confidence"] = result.choices[0].message.parsed.confidence
    return state
```

### Specialized Agent (Deposit Agent example)
```python
# graph/agents/deposit.py
from ollama import AsyncClient  # or Together.ai client in production

DEPOSIT_SYSTEM = """You are a specialized deposit support agent for OKBET.
Your sole domain: failed deposits, pending transactions, payment methods, 
deposit limits, and balance crediting issues.

RULES:
1. Never state account balances or transaction statuses not provided in context
2. If you cannot resolve without backend data, provide exact escalation steps
3. Be concise: 20–80 words per response
4. Always provide a next action step

KNOWLEDGE CONTEXT:
{knowledge}"""

async def run(state: AgentState) -> AgentState:
    # RAG: pull relevant knowledge chunks
    knowledge = await fetch_knowledge(state["tenant_id"], state["query"], agent_type="deposit")

    messages = [
        {"role": "system", "content": DEPOSIT_SYSTEM.format(knowledge=knowledge)},
        {"role": "user",   "content": state["query"]}
    ]

    ollama = AsyncClient()
    response = await ollama.chat(
        model="csr-hermes-deposit",  # base model + deposit LoRA adapter loaded
        messages=messages,
        options={"temperature": 0.1, "num_ctx": 2048}
    )
    state["response"] = response["message"]["content"]
    return state
```

---

## CONTINUOUS LEARNING LOOP

### Architecture (Correct Version)
```
DAILY (automated, free):
├── Extension exports new sessions → S3/local storage
├── quality_score.py runs on new sessions
├── High-quality examples (score ≥ 0.75) → TrainingExample table (Neon)
└── Cache populated with new resolved patterns → Upstash Vector

WEEKLY SUNDAY 02:00 UTC (QStash scheduled job):
├── Count pending examples in TrainingExample table
├── If count ≥ 200: trigger training job on Lambda Labs (API call)
│   ├── Pull: 30% new examples + 70% replay buffer (best historical)
│   ├── Run QLoRA fine-tune (Unsloth) — ~4 hours, ~$12
│   ├── Evaluate new adapter on holdout set
│   ├── If eval_accuracy > current_accuracy: promote adapter (production)
│   ├── If eval_accuracy < current_accuracy - 0.02: reject + alert
│   └── Update TrainingRun record in Neon
└── If count < 200: skip, log "insufficient data"

MONTHLY:
└── Human review of ReviewQueue items
    ├── Corrected responses → high-quality training examples
    └── Patterns → update knowledge base (KnowledgeChunk)
```

### learning/scheduler.py (QStash trigger)
```python
# This endpoint is called by Upstash QStash every Sunday 02:00 UTC
from fastapi import APIRouter
from learning.trainer import should_train, run_training_job
import asyncio

router = APIRouter()

@router.post("/api/training/weekly-trigger")
async def weekly_training_trigger(x_qstash_signature: str = Header(...)):
    # Verify QStash signature
    verify_qstash(x_qstash_signature)

    for tenant_id in await get_active_tenants():
        count = await count_pending_examples(tenant_id)
        if count >= 200:
            asyncio.create_task(run_training_job(tenant_id, count))

    return {"status": "triggered"}
```

---

## LLM AUDITOR (Async Judge)

### How It Works
- Samples **5% of all responses** asynchronously (non-blocking)
- Uses **Claude Haiku** (cheapest capable model) — $0.001 per eval
- At 10K queries/month: 500 audits × $0.001 = **$0.50/month**
- Flags responses below threshold → `ReviewItem` table → dashboard queue

```python
# auditor/judge.py
import anthropic, asyncio, random

client = anthropic.Anthropic()

JUDGE_PROMPT = """You are a quality auditor for a CSR AI system serving an online betting platform.

Evaluate this CSR response for:
1. accuracy (0-10): Is the response factually correct and helpful?
2. hallucination_risk (0-10): Does it claim specific data it couldn't know?
3. safety (0-10): Does it contain PII or inappropriate content?
4. resolution (0-10): Does it actually help resolve the customer's issue?

Query: {query}
Response: {response}

Return JSON only: {"accuracy": N, "hallucination_risk": N, "safety": N, "resolution": N, "flag": bool, "flag_reason": "string or null"}"""

async def audit_response(query_event_id: str, query: str, response: str, sample_rate: float = 0.05):
    if random.random() > sample_rate:
        return  # not sampled

    result = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        messages=[{"role": "user", "content": JUDGE_PROMPT.format(query=query, response=response)}]
    )

    scores = json.loads(result.content[0].text)
    composite = (scores["accuracy"] + scores["resolution"]) / 2 / 10
    hallucination_risk = 1 - scores["hallucination_risk"] / 10

    # Flag if composite < 0.6 OR hallucination_risk > 0.5
    should_flag = scores["flag"] or composite < 0.6

    await db.query_event.update(
        where={"id": query_event_id},
        data={"auditorScore": composite, "flaggedForReview": should_flag}
    )

    if should_flag:
        await db.review_item.create(data={
            "tenantId": ...,
            "queryText": query,
            "responseText": response,
            "auditReason": scores["flag_reason"] or "low_composite_score",
            "auditScore": composite
        })
```

---

## FRONTEND — LANDING PAGE + DASHBOARD

### Stack
- Next.js 15 App Router
- Tailwind CSS v4 (CSS-first, `@import "tailwindcss"` in globals.css)
- Shadcn/ui (latest — run `bunx shadcn init` with Tailwind v4 support)
- Motion (Framer) for animations

### Tailwind v4 Setup
```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-brand-50:  #f0f4ff;
  --color-brand-500: #4f46e5;
  --color-brand-600: #4338ca;
  --color-brand-900: #1e1b4b;

  --color-surface:   #0f0f14;
  --color-surface-2: #16161f;
  --color-surface-3: #1e1e2a;

  --font-display: "Syne", sans-serif;
  --font-body:    "DM Sans", sans-serif;
  --font-mono:    "JetBrains Mono", monospace;

  --radius-brand: 0.75rem;
}
```

### Landing Page Sections
```
/app/(marketing)/page.tsx structure:

1. <HeroSection>
   - Headline: "21 agents. One AI."
   - Subhead: ROI framing — "Cut your CSR cost by 61% in 30 days"
   - CTA: "Start Free Pilot" + "See it live →"
   - Visual: animated real-time query resolution demo

2. <ProblemSection>
   - Current state pain: cost, speed, 24/7 coverage
   - Before/after resolution time comparison

3. <HowItWorksSection>
   - 5-agent architecture diagram (animated)
   - Semantic cache explanation
   - Learning loop visualization

4. <MetricsSection>
   - Live counters: queries resolved, avg resolution time, cost saved
   - "Built on real betting platform data"

5. <PricingSection>
   - Free / Starter / Growth / Enterprise cards
   - OKBET case study framing

6. <CTASection>
   - "Get your first 500 queries free"
```

### Dashboard Routes
```
/dashboard
├── /                  ← Overview: daily queries, resolution rate, cache hit %, cost saved
├── /agents            ← Agent performance breakdown (deposit/withdrawal/etc)
├── /cache             ← Cache analytics: hit rate, top cached patterns
├── /review-queue      ← Human review UI: approve/correct/reject flagged responses
├── /training          ← Training run history, accuracy trends, adapter versions
├── /knowledge         ← Manage knowledge chunks per agent type
└── /settings          ← API keys, webhook config, tier/billing
```

---

## BUN COMMANDS REFERENCE

```bash
# Init workspace
bun init
bun install

# Next.js dev
bun run dev            # not npm run dev

# Add dependencies
bun add @prisma/client prisma
bun add @upstash/redis @upstash/vector @upstash/qstash
bun add next-auth@beta
bun add @vercel/ai ai
bun add stripe

# Shadcn with Tailwind v4
bunx shadcn init       # select tailwind v4 when prompted
bunx shadcn add button card dialog table badge

# DB
bun run db:push        # prisma db push
bun run db:generate    # prisma generate
bun run db:studio      # prisma studio

# Extension build
cd packages/extension
bun run build          # Vite outputs to dist/

# Python inference (separate venv)
python -m venv .venv && source .venv/bin/activate
pip install fastapi uvicorn langgraph langchain-openai \
    upstash-vector upstash-qstash ollama anthropic \
    unsloth trl datasets lxml pydantic --break-system-packages
```

---

## COST BREAKDOWN (Bootstrapped — Zero to First Revenue)

### Month 1–2 (Development Phase)
| Item | Cost |
|------|------|
| Neon free tier | $0 |
| Upstash Redis free tier (10K cmds/day) | $0 |
| Upstash Vector free tier (10K queries/day) | $0 |
| Vercel hobby (Next.js) | $0 |
| Railway Starter (inference service) | $5/month |
| GPT-4o-mini (router) — dev testing | ~$1 |
| First training run (Lambda Labs A10, ~6hr) | ~$7 |
| **Total Month 1** | **~$13** |

### Month 3 (Pilot with OKBET — Free Tier Per Agreement)
| Item | Cost |
|------|------|
| Railway inference | $5 |
| Weekly training run × 4 | ~$48 |
| Claude Haiku auditor (5% sample) | ~$0.50 |
| Neon pro (if needed) | $19 |
| **Total Month 3** | **~$73** |

### Post-Revenue (OKBET paying $499/month on Growth tier)
| Item | Cost | Revenue | Margin |
|------|------|---------|--------|
| Infrastructure | ~$100/mo | $499/mo | **$399/mo (80%)** |

---

## BUILD SEQUENCE (Ordered by Dependency)

### Week 1: Foundation
```
Day 1-2:
☐ bun workspace init (monorepo structure)
☐ Next.js 15 scaffold — apps/web
☐ Tailwind v4 + Shadcn init
☐ Neon database setup + Prisma schema push
☐ Upstash Redis + Vector setup (free tiers)
☐ NextAuth v5 basic config

Day 3-5:
☐ Extension scaffold (packages/extension)
☐ manifest.json + vite.config.ts (Bun-compatible)
☐ crypto/vault.ts (AES-GCM)
☐ content/observer.ts (MutationObserver)
☐ content/extractor.ts (multi-strategy DOM)
☐ content/anonymizer.ts (PII scrub)

Day 6-7:
☐ FastAPI app scaffold (apps/inference)
☐ LangGraph StateGraph skeleton
☐ Input/output guard stubs
☐ Semantic cache layer (Upstash Vector)
```

### Week 2: Core Pipeline
```
☐ Extension: media-capture.ts
☐ Extension: xml-formatter.ts + popup export UI
☐ LangGraph: Router (GPT-4o-mini classifier)
☐ LangGraph: Deposit agent (first specialized agent)
☐ Semantic cache: full lookup + write
☐ API route: /api/chat (Next.js → FastAPI proxy)
☐ End-to-end test: query → router → agent → cache write → response
```

### Week 3: All Agents + Guards
```
☐ Withdrawal, Verification, Onboarding, General agents
☐ Output guard (confidence scoring, PII leak check)
☐ Input guard (scope filter, PII detection)
☐ Async auditor (Claude Haiku judge)
☐ ReviewItem creation on flag
☐ TrainingExample ingestion from extension exports
```

### Week 4: Training Pipeline
```
☐ pipeline/convert.py (XML → JSONL)
☐ pipeline/quality_score.py (reward scoring)
☐ pipeline/finetune.py (Unsloth QLoRA)
☐ pipeline/evaluate.py (RAGAS + custom metrics)
☐ First real training run on collected sessions
☐ Ollama: register GGUF adapter
☐ learning/scheduler.py (QStash weekly trigger)
```

### Weeks 5–6: Frontend
```
☐ Landing page (marketing) — all sections
☐ Auth flow (login/register)
☐ Dashboard layout + nav
☐ Analytics page (query volume, resolution rate, cache %)
☐ Agent performance breakdown
☐ Review queue UI (approve/correct/reject)
☐ Training run history page
☐ Pricing page + Stripe checkout
```

### Week 7: Polish + Pilot Prep
```
☐ Tier enforcement middleware
☐ API key management
☐ Webhook endpoint for LiveAgent integration
☐ OKBET tenant setup (Growth tier, $0 billing)
☐ Demo script preparation
☐ Thompson pitch deck
```

---

## CLAUDE CODE PROMPTS (Copy-Paste Ready)

### Prompt 1 — Extension Core
```
You are building a Chrome MV3 browser extension in TypeScript using Bun + Vite.

Project: packages/extension/ inside a Bun monorepo.
Platform: LiveAgent live-chat (liveagent.com) — authenticated CSR agent sessions.
Authorization: Fully authorized by signed agreement. No security bypass involved.

Build in this exact order:
1. lib/schema.ts — TypeScript interfaces: ChatMessage, Session, ExtractedContext
2. crypto/vault.ts — AES-GCM encrypt/decrypt using Web Crypto API. Key in chrome.storage.session
3. content/anonymizer.ts — strip PII: emails, account IDs, names, phone numbers. Keep amount ranges.
4. content/extractor.ts — multi-strategy DOM extraction. Strategy 1: role="log" + role="article". Strategy 2: [data-testid*="message"]. Strategy 3: [aria-label*="message"]. Strategy 4: time-stamped <p> fallback. ZERO CSS class selectors.
5. content/media-capture.ts — capture <img> src via canvas.toDataURL(). Log attachment href + filename.
6. content/observer.ts — MutationObserver on role="log". Wire extractor + anonymizer + vault.
7. background/service-worker.ts — session lifecycle management.
8. lib/xml-formatter.ts — serialize Session to XML with CDATA.
9. popup/popup.ts + popup/index.html — session controls, export button, stats display.
10. manifest.json (MV3) + vite.config.ts (@crxjs/vite-plugin, Bun-compatible).

Constraints: TypeScript strict. Zero network calls. All storage writes encrypted. Bun-compatible package.json.
```

### Prompt 2 — LangGraph Multi-Agent System
```
You are building a Python FastAPI + LangGraph multi-agent orchestration system.

Project: apps/inference/
Purpose: Route CSR queries to specialized AI agents for an online betting platform.

Build:
1. graph/workflow.py — LangGraph StateGraph with nodes: input_guard → cache_check → router → [5 agents] → output_guard → cache_write
2. graph/router.py — GPT-4o-mini classifier with Pydantic structured output. Categories: deposit|withdrawal|verification|onboarding|general
3. graph/agents/deposit.py — Ollama client, RAG knowledge fetch, Hermes-3 with deposit LoRA, response generation
4. graph/agents/ — repeat pattern for withdrawal, verification, onboarding, general
5. graph/guards/input_guard.py — scope check (is query CSR-relevant?) + PII detection (don't process raw PII)
6. graph/guards/output_guard.py — confidence scoring, hallucination risk check (claims without context), PII leak scan
7. cache/semantic.py — Upstash Vector lookup (cosine ≥ 0.92 = cache hit) + write with TTL
8. auditor/judge.py — Claude Haiku async judge, 5% sample rate, writes to DB on flag
9. main.py — FastAPI app, /api/infer endpoint, /api/training/weekly-trigger endpoint

State type: AgentState TypedDict with: query, tenant_id, embedding, intent, response, cache_hit, confidence, guard_passed, flagged, flag_reason

Use: langraph, fastapi, anthropic, openai, upstash-vector, ollama python client, pydantic v2
```

### Prompt 3 — Next.js Dashboard
```
You are building a Next.js 15 App Router dashboard in TypeScript (strict mode).

Project: apps/web/
Stack: Next.js 15, Tailwind CSS v4 (@theme directive, no config file), Shadcn/ui latest, Prisma + Neon, Upstash Redis

Build the dashboard routes under app/(dashboard)/:

1. layout.tsx — sidebar nav, tenant context, auth guard
2. page.tsx (overview) — KPI cards: queries today, resolution rate, cache hit %, estimated cost saved. Area chart (Recharts): daily query volume by agent type. Recent flagged items preview.
3. agents/page.tsx — table: agent name, queries handled, avg resolution ms, accuracy score, adapter version. Per-agent trend sparklines.
4. cache/page.tsx — cache hit rate gauge, top 20 cached patterns table, cache size, TTL distribution.
5. review-queue/page.tsx — flagged response cards: query | AI response | audit reason | score. Actions: Approve | Correct (textarea) | Reject. Server actions for each.
6. training/page.tsx — training run history table: date | examples | eval accuracy | delta | status badge (PROMOTED/REJECTED). Accuracy trend line chart.
7. settings/page.tsx — API key display/rotate, webhook URL, tier badge, billing portal link (Stripe).

Conventions: Server Components by default. Use 'use client' only for interactive parts. Server Actions for mutations. Prisma client via lib/db.ts (singleton). All data fetching in page.tsx server components.

Do NOT use src/ folder. Do NOT add page-level loading.tsx unless needed.
```

### Prompt 4 — Landing Page
```
You are building a premium SaaS landing page for AutoCSR — an AI automation platform for online betting customer service.

Project: apps/web/app/(marketing)/page.tsx
Stack: Next.js 15, Tailwind CSS v4, Motion (Framer), Shadcn/ui

Design direction: Dark, authoritative, enterprise-grade. Not startup-playful. Think: Bloomberg Terminal meets Vercel dashboard. Color palette: deep navy surface (#0f0f14), electric indigo accent (#4f46e5), white type. Font: Syne (display) + DM Sans (body). Sharp geometric layouts. Data-forward visuals.

Sections to build:
1. HeroSection — "21 agents. One AI." Animated query counter. Two CTAs. No stock imagery.
2. ProblemSection — before/after cost comparison. Animated number flip: 14L BDT → 3.45L BDT.
3. HowItWorksSection — 5-agent architecture. Animated flow diagram using CSS/SVG. Cache hit rate animation.
4. MetricsSection — live stat counters (use fake seed data for demo): "4,821 queries resolved today", "94ms avg response", "61% cost reduction". Animated on scroll into view.
5. PricingSection — Free/Starter/Growth/Enterprise cards. Growth highlighted. Annual toggle.
6. CTASection — "Start your free 30-day pilot" form. Email input + CTA button.

Motion: staggered section reveals on scroll. Number counters animate up on entry. Keep performant — no JS-heavy effects above the fold.

Tone: Direct, metric-forward, zero fluff. This sells to COOs and ops directors, not developers.
```

---

## OPEN QUESTIONS (Decide Before Building)

| Question | Options | Recommendation |
|----------|---------|----------------|
| Inference in prod: self-host vs API | Ollama on Railway vs Together.ai | **Together.ai** for MVP — no GPU management, $0.18/1M tokens, Hermes-3 available |
| When to switch to self-hosted | At 50K+ queries/month | Then Railway GPU or Hetzner dedicated |
| LoRA adapter storage | Local filesystem vs S3 | **Cloudflare R2** (free tier 10GB) |
| Multi-tenancy: shared vs isolated models | Shared base model, tenant-specific knowledge | Shared base + per-tenant knowledge chunks in pgvector |
| Extension → data ingestion | Manual export vs auto-push | **Phase 1:** Manual export to encrypted file. **Phase 2:** Encrypted POST to your own API endpoint |

---

## RISK LOG (Updated)

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Catastrophic forgetting in continuous learning | High (if daily) | High | Weekly training + 70% replay buffer — solved by design |
| Cache poisoning (bad response cached) | Medium | Medium | Min quality_score ≥ 0.80 to cache. Auditor can invalidate cache entries. |
| LangGraph routing error (wrong agent) | Medium | Low | General agent as catch-all. Router confidence < 0.7 → always route to general |
| Together.ai rate limits at scale | Low | Medium | Implement queue + retry. Fallback to Ollama local. |
| LiveAgent UI update breaks extension | Medium | High | ARIA-first extraction. MutationObserver on stable role attributes. |
| OKBET rejects pilot results | Low | High | Free 6-month period removes their financial risk entirely |

---

*Document: MASTER_PLAN v2 | TechSci, Inc. | June 2, 2026*  
*Next: ARCHITECTURE.md (deep-dive system design) | Generate after Week 2 build confirmation*

---

## AUDIT FINDINGS & AMENDMENTS — June 8, 2026

> Full codebase audit conducted June 8, 2026. All items below represent divergences from this plan, confirmed bugs, feature gaps, and design decisions made during implementation. This section supersedes conflicting content above.

### Plan vs Reality Corrections

| Item | MASTER_PLAN v2 | Actual Implementation |
|------|---------------|----------------------|
| Next.js version | 15 | **16** (App Router, no src/) |
| Billing | Stripe | **Polar** (sandbox) — Polar wraps Stripe; `stripeCustomerId` field in Tenant is a Polar customer ID |
| Stripe ref in routes | `app/api/webhooks/stripe/` | **`app/api/webhooks/polar/route.ts`** — matches on `customer.externalId` (= tenantId) |
| Animation library | Framer Motion | **Motion** (`import from 'motion/react'`) — rebranded package |
| Billing product IDs | Not in plan | Polar sandbox org `d86c3924-e933-4322-ab4a-83370cc25f1c`: Starter `1500891c`, Growth `f3459e45`, Enterprise `e40620eb` |
| Font system | Not specified | **Geist** (display) + **Inter** (body) + **JetBrains Mono** (mono/numbers) — updated 2026-06-08 |
| TrainingRun tenantId | Required (`String`) | **Nullable** (`String?`) — global runs possible |
| Inference workflow | `workflow.invoke()` | **BUG**: Should be `await workflow.ainvoke()` — sync call in async FastAPI handler; will block event loop |
| QStash sig verification | JWT-based | **BUG**: Current code uses `hmac.hexdigest()` which is likely wrong; QStash uses JWT. Needs verification against QStash docs |
| Weekly cron endpoint | Not specified | `/api/training/weekly-trigger` in inference; QStash cron ID `scd_774mX3PfErmkHCEDcjedjkG7Vs4s` fires Sunday 02:00 UTC |
| Weekly trigger pool | Reuses `_db_pool` | **BUG**: Creates new asyncpg pool instead of reusing shared `_db_pool` — connection leak per trigger |
| Session callback caching | Not specified | **PERF**: Session callback hits DB on EVERY request — no caching. High-frequency issue. |
| Polar webhook console.log | Not specified | **SEC**: `console.log(event)` dumps full webhook event (incl. customer data) in prod logs |

### Confirmed Feature Gaps

| Feature | Status | Notes |
|---------|--------|-------|
| Knowledge base (end-to-end) | ❌ NOT FUNCTIONAL | Upload validates + creates `KnowledgeDocument` row then stops. No file storage, no chunking, no embedding, no retrieval. Status stays `PROCESSING` forever. |
| Cache threshold per-tenant | ❌ NOT FUNCTIONAL | UI writes `Tenant.cacheThreshold` to DB correctly. Inference reads `SEMANTIC_CACHE_THRESHOLD` env var **once at startup** — DB value has zero runtime effect. |
| Disconnect / data deletion | ❌ STUB | `app/api/settings/danger-zone/disconnect/route.ts` returns `{scheduled:true}`. No Polar cancel, no data deletion. |
| Avatar / profile image upload | ❌ NOT IMPLEMENTED | `User.image String?` exists (OAuth only). No file upload UI, no upload API, no storage (no R2/S3 bucket). Profile page renders name + company only. |
| `/demo` page | ❌ MISSING | Hero section links to `/demo` which does not exist — 404 in prod. |
| Sitemap | ✅ CREATED | `apps/web/app/sitemap.ts` added 2026-06-08 |

### New Files Created (June 8, 2026)

| File | Description |
|------|-------------|
| `BRAND.md` | Full brand vision, voice guidelines, typography, color tokens, component patterns |
| `apps/web/app/(marketing)/terms/page.tsx` | 13-section Terms of Service — iGaming-specific, Delaware law, JAMS arbitration |
| `apps/web/app/(marketing)/privacy/page.tsx` | GDPR-compliant Privacy Policy with legal basis table, SCCs, DPA contact |
| `apps/web/app/(marketing)/refund/page.tsx` | Refund Policy — 7-day grace (new customers), 30-day annual pro-rata |
| `apps/web/public/robots.txt` | Google-friendly robots.txt — blocks /dashboard/, /api/, /login, /signup |
| `apps/web/app/sitemap.ts` | Next.js dynamic sitemap — `/`, `/pricing`, `/terms`, `/privacy`, `/refund` |
| `apps/web/app/layout.tsx` | Updated: full OG/Twitter SEO metadata, canonical URL, Geist+Inter+JetBrains font system |

### Typography System (Canonical — Use These Values)

```css
--font-display: Geist (localFont from GeistVF.woff2) — headlines, nav, CTAs
--font-body:    Inter (Google Font) — body text, descriptions, UI labels
--font-mono:    JetBrains Mono (Google Font) — ALL numbers, timestamps, agent names, code
```

**Critical rule**: Every number, timestamp, metric, and agent name must use `font-mono` / `JetBrains Mono`. No exceptions. Use `className="font-mono"` everywhere.

> To activate Geist: either `bun add geist` and update `layout.tsx` to use the npm package, or place `GeistVF.woff2` in `apps/web/fonts/`. Until then, `localFont` falls back to `system-ui`.

### Design Tokens (Canonical — Use These Values)

```
bg-base:       #090910
bg-surface:    #0f0f18
bg-surface-2:  #141420
border:        rgba(255,255,255,0.06)
border-strong: rgba(255,255,255,0.12)
text:          #e8e8f0
text-sub:      #606075
text-dim:      #30303f
accent:        #4f46e5
accent-glow:   rgba(79,70,229,0.12)
green:         #22c55e
amber:         #f59e0b
red:           #ef4444
```

### SEO Setup (Complete)

- Root `layout.tsx`: full `<Metadata>` with OG, Twitter card, robots, canonical, keywords
- `public/robots.txt`: blocks auth/dashboard/api, allows all marketing pages
- `app/sitemap.ts`: dynamic sitemap at `/sitemap.xml`
- Legal pages: each has individual SEO metadata with canonical
- **Still needed**: `public/og.png` (1200×630 OG image) — referenced in metadata but not created

### Critical Code Fixes Needed (Priority Order)

1. **`apps/inference/main.py`** — `workflow.invoke()` → `workflow.ainvoke()` in the async `/api/chat` handler. Sync call blocks the uvicorn event loop; all concurrent requests will queue behind one inference call.

2. **`apps/inference/main.py`** — Weekly trigger creates a new asyncpg connection pool instead of reusing `_db_pool`. Fix: pass `_db_pool` to the trigger handler or use the shared pool.

3. **`apps/inference/main.py`** — QStash signature verification likely incorrect. Audit against QStash JWT verification docs before going to production.

4. **`apps/web/lib/auth.ts`** — Session callback queries DB on every `getSession()` call. Add Redis caching with a short TTL (30–60s) to avoid N×DB hits per page load.

5. **`apps/web/app/api/webhooks/polar/route.ts`** — Remove `console.log(event)` before production deploy. Dumps full customer + billing event to logs.

6. **Knowledge base** — Implement end-to-end: upload to R2/S3 → chunk → embed → store in pgvector. Currently the most critical functional gap for multi-tenant value proposition.

### Neon DB — Two Endpoints (Not in Original Plan)

```
Pooler   (app queries):  ep-proud-sound-aoyz34le-pooler.c-2.ap-southeast-1.aws.neon.tech
Non-pooler (auth tables): ep-proud-sound-aoyz34le.c-2.ap-southeast-1.aws.neon.tech
```

Auth tables (`Account`, `User`, `Session`, `Tenant`, `VerificationToken`) live on non-pooler.  
App tables (`QueryEvent`, `KnowledgeChunk`, `ReviewItem`, `TrainingRun`, etc.) on pooler.  
Prisma uses pooler with `?channel_binding=require`. Direct psql needs non-pooler URL.

### OKBET Pilot Details

- Tenant: GROWTH tier, free 6 months post-deploy
- Authorized inference IPs: `153.53.253.81`, `89.117.176.115`, `103.170.173.26` (DB-driven, not hardcoded)
- Setup: `bun run setup:okbet` after OKBET admin first login
- ngrok static URL: `https://foziest-prius-maranda.ngrok-free.dev`
- QStash weekly cron: Sunday 02:00 UTC → ngrok:8000 (must tunnel to port 8000, not 3000)

---

*Amended: June 8, 2026 | TechSci, Inc. | Full audit + legal/SEO pass complete*
