<div align="center">

<img src="https://img.shields.io/badge/AutoCSR-AI%20Customer%20Service-6366f1?style=for-the-badge&logoColor=white" alt="AutoCSR" />

# AutoCSR — AI-Native CSR Automation

**Cut your customer service cost by 61% in 30 days.**  
Multi-agent AI platform purpose-built for online betting platforms.

[![Next.js](https://img.shields.io/badge/Next.js%2015-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript%205-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Python](https://img.shields.io/badge/Python%203.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Bun](https://img.shields.io/badge/Bun-black?style=flat-square&logo=bun&logoColor=white)](https://bun.sh)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/Neon%20PostgreSQL-00E599?style=flat-square&logo=neon&logoColor=black)](https://neon.tech)
[![Prisma](https://img.shields.io/badge/Prisma%206-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io)
[![Upstash](https://img.shields.io/badge/Upstash%20Redis-00E9A3?style=flat-square&logo=upstash&logoColor=black)](https://upstash.com)
[![Polar](https://img.shields.io/badge/Polar-0ea5e9?style=flat-square&logoColor=white)](https://polar.sh)
[![Vercel](https://img.shields.io/badge/Vercel-black?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

[![CI](https://github.com/rihanaws/autocsr-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/rihanaws/autocsr-ai/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](LICENSE)
[![Owner](https://img.shields.io/badge/Owner-TechSci%20Inc-6366f1?style=flat-square)](https://github.com/rihanaws)

</div>

---

## What Is AutoCSR?

AutoCSR is a multi-agent AI platform that automates customer service for online betting platforms. It routes queries to specialized AI agents, caches repeated patterns semantically, and continuously improves through a weekly fine-tuning loop — all without human intervention for 80%+ of tickets.

**Pilot client:** OKBET (Gavin Ventures, Inc.) — signed data agreement June 2, 2026.

---

## Architecture

```
Customer Query
      │
      ▼
┌─────────────────────────────────────────────┐
│           NEXT.JS 15 LAYER (Vercel)          │
│  Auth · Tenant Dashboard · API Routes        │
└──────────────────┬──────────────────────────┘
                   │ HTTP
┌──────────────────▼──────────────────────────┐
│        FASTAPI ORCHESTRATION (Railway)       │
│                                              │
│  Input Guard (scope filter + PII redact)     │
│       │                                      │
│       ▼                                      │
│  Semantic Cache (Upstash Vector, cos ≥ 0.92) │
│       │                                      │
│       └─ MISS → GPT-4o-mini Router           │
│                       │                      │
│       ┌───────────────┼───────────────┐      │
│       ▼               ▼               ▼      │
│   Deposit        Withdrawal      Verification│
│   LoRA-01         LoRA-02         LoRA-03    │
│                                              │
│       ┌───────────────┘                      │
│       ▼               ▼                      │
│   Onboarding       General                   │
│   LoRA-04          LoRA-05                   │
│                                              │
│  Output Guard (hallucination + PII scan)     │
│       │                                      │
│       ▼                                      │
│  Cache Write + Async Auditor (fire & forget) │
└──────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              ASYNC LAYER                     │
│  Claude Haiku Auditor (5% sample)            │
│  Weekly QLoRA Fine-tune (Unsloth)            │
│  Human Review Queue (flagged responses)      │
└──────────────────────────────────────────────┘
```

**Cache hit rate after 2 weeks:** 55–70% of queries → $0 LLM cost.

---

## Five Specialized Agents

| Agent | Domain | LoRA Adapter |
|-------|--------|-------------|
| **Deposit** | Failed deposits, pending payments, balance credits | LoRA-01 |
| **Withdrawal** | Withdrawal requests, limits, pending | LoRA-02 |
| **Verification** | KYC, identity docs, account verification | LoRA-03 |
| **Onboarding** | New accounts, registration, welcome bonus | LoRA-04 |
| **General** | Everything else (catch-all, confidence < 0.7) | LoRA-05 |

Base model: **Hermes-3-Llama-3.1-8B** — one model, five lightweight LoRA adapters (~80MB each).

---

## Monorepo Structure

```
autocsr/
├── apps/
│   ├── web/                    ← Next.js 15 SaaS platform
│   │   ├── app/                ← App Router (no src/)
│   │   │   ├── (marketing)/    ← Landing, pricing
│   │   │   ├── (auth)/         ← Login, register
│   │   │   ├── (dashboard)/    ← Tenant dashboard
│   │   │   └── api/            ← /chat, /webhook, /stripe
│   │   ├── components/
│   │   │   ├── ui/             ← Shadcn/ui components
│   │   │   ├── marketing/
│   │   │   └── dashboard/
│   │   ├── lib/
│   │   │   ├── db.ts           ← Prisma + Neon adapter
│   │   │   ├── redis.ts        ← Upstash Redis
│   │   │   ├── vector.ts       ← Upstash Vector
│   │   │   └── auth.ts         ← NextAuth v5
│   │   └── prisma/
│   │       └── schema.prisma
│   │
│   └── inference/              ← Python FastAPI + LangGraph
│       ├── main.py
│       ├── graph/              ← Router + 5 agents + guards
│       ├── cache/              ← Semantic cache layer
│       ├── auditor/            ← Claude Haiku judge
│       └── learning/           ← Weekly fine-tune pipeline
│
├── packages/
│   └── extension/              ← Chrome MV3 data collector
│       └── src/
│           ├── content/        ← Extractor + anonymizer
│           ├── crypto/         ← AES-GCM vault
│           └── background/
│
├── pipeline/                   ← Python ML training scripts
└── docs/
    └── MASTER_PLAN.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Bun](https://bun.sh) |
| Frontend | [Next.js 15](https://nextjs.org) App Router |
| Language | TypeScript 5.x strict / Python 3.11 |
| UI | [Shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS v4](https://tailwindcss.com) |
| Animation | [Motion](https://motion.dev) (Framer) |
| AI Agents | [LangGraph](https://langchain-ai.github.io/langgraph/) |
| AI SDK | [Vercel AI SDK v4](https://sdk.vercel.ai) |
| LLM | Hermes-3-Llama-3.1-8B + LoRA via [Ollama](https://ollama.com) / [Together.ai](https://together.ai) |
| Router | GPT-4o-mini (structured output) |
| Auditor | Claude Haiku (async, 5% sample) |
| Database | [Neon](https://neon.tech) PostgreSQL + [Prisma 6](https://prisma.io) |
| Cache | [Upstash Redis](https://upstash.com) + [Upstash Vector](https://upstash.com) |
| Queue | [Upstash QStash](https://upstash.com/qstash) |
| Auth | [NextAuth.js v5](https://authjs.dev) |
| Billing | [Polar](https://polar.sh) |
| Email | [Resend](https://resend.com) |
| Inference Host | [Railway](https://railway.app) |
| Frontend Host | [Vercel](https://vercel.com) |
| Extension Build | [Vite](https://vitejs.dev) + [@crxjs/vite-plugin](https://crxjs.dev) |

---

## Pricing

| Tier | Queries/month | Price |
|------|--------------|-------|
| Free | 500 | $0 |
| Starter | 10,000 | $149/mo |
| Growth | 50,000 | $499/mo |
| Enterprise | Unlimited | Custom |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.1
- [Python](https://python.org) 3.11+
- [Neon](https://neon.tech) account (free tier works)
- [Upstash](https://upstash.com) account (free tier works)

### Setup

```bash
# Clone
git clone https://github.com/rihanaws/autocsr-ai.git
cd autocsr-ai

# Install JS deps
bun install

# Configure env
cp apps/web/.env.example apps/web/.env.local
# Fill in: DATABASE_URL, AUTH_SECRET, UPSTASH_*, AUTH_GOOGLE_*

# Push database schema (dotenv-cli loads .env.local automatically)
cd apps/web
bun run db:push

# Start Next.js dev server
bun run dev

# Python inference service (separate terminal)
cd apps/inference
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Add Shadcn components

```bash
cd apps/web
bunx shadcn add button card dialog table badge tabs input
```

### Build extension

```bash
cd packages/extension
bun install
bun run build   # outputs to dist/
```

---

## Development Commands

```bash
# From repo root
bun run dev          # Next.js dev (turbopack)
bun run build        # Production build
bun run db:push      # Push Prisma schema to Neon
bun run db:studio    # Prisma Studio GUI
bun run ext:build    # Build Chrome extension
```

---

## Environment Variables

Copy `apps/web/.env.example` to `apps/web/.env.local`. Required vars:

| Variable | Source |
|----------|--------|
| `DATABASE_URL` | [Neon Console](https://console.neon.tech) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `SECRET` | [Google Cloud Console](https://console.cloud.google.com) |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | [Upstash Console](https://console.upstash.com) |
| `UPSTASH_VECTOR_REST_URL` / `TOKEN` | [Upstash Console](https://console.upstash.com) |
| `POLAR_ACCESS_TOKEN` / `POLAR_WEBHOOK_SECRET` | [Polar Dashboard](https://dashboard.polar.sh) |
| `POLAR_PRODUCT_ID_STARTER` / `_GROWTH` / `_ENTERPRISE` | [Polar Products](https://dashboard.polar.sh) |
| `RESEND_API_KEY` | [Resend](https://resend.com/api-keys) |

---

## Build Progress

- [x] **Week 1** — Monorepo, Next.js 15, Tailwind v4, Prisma + Neon, Auth, Extension scaffold, FastAPI skeleton
- [x] **Week 2** — LangGraph pipeline, semantic cache, /api/chat proxy, extension export
- [x] **Week 3** — All 5 agents, guards, async auditor, Polar billing, full landing page, full tenant dashboard (overview + agents + review queue + training)
- [ ] **Week 4** — Email (Resend), E2E Chrome extension test, training pipeline (Unsloth QLoRA), scheduler, knowledge/cache/settings pages
- [ ] **Week 5** — OKBET pilot prep, Thompson pitch

---

## License

Proprietary — TechSci, Inc. All rights reserved.  
Data agreement with OKBET (Gavin Ventures, Inc.) effective June 2, 2026.
