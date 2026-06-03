# AutoCSR — Claude Code Context

## What This Is
AI-native CSR automation SaaS for online betting platforms.
Owner: TechSci, Inc. / Sayem Abdullah Rihan.
Data agreement signed with OKBET (Gavin Ventures, Inc.) — June 2, 2026.
Full plan: read `docs/MASTER_PLAN.md` before starting any new phase.

**Repo:** https://github.com/rihanaws/autocsr-ai (private)
**Default branch:** `main`

---

## Package Manager — CRITICAL
**Always `bun`. Never `npm`, `yarn`, or `pnpm`.**
```
bun install          # not npm install
bun add <pkg>        # not npm install <pkg>
bun run <script>     # not npm run <script>
bunx <bin>           # not npx <bin>
```

---

## Stack (Quick Reference)
| Layer | Choice |
|-------|--------|
| Runtime | Bun |
| Frontend | Next.js 15 App Router (no src/ folder) |
| Language | TypeScript 5.x strict |
| UI | Shadcn/ui + Tailwind CSS v4 |
| Animation | Motion (Framer) — import from `'motion/react'` |
| Database | Neon (PostgreSQL) + Prisma 6 |
| Cache | Upstash Redis + Upstash Vector |
| Queue | Upstash QStash |
| Auth | NextAuth.js v5 |
| Billing | Stripe |
| Email | Resend + React Email |
| AI SDK | Vercel AI SDK v4 |
| Inference | FastAPI (Python 3.11) + LangGraph |
| Model | Hermes-3-Llama-3.1-8B + LoRA adapters via Ollama |

---

## Monorepo Structure
```
autocsr/
├── apps/
│   ├── web/                    ← Next.js 15 SaaS (primary)
│   └── inference/              ← Python FastAPI + LangGraph
├── packages/
│   └── extension/              ← Chrome MV3 data collector
├── pipeline/                   ← Python ML training scripts
├── docs/
│   └── MASTER_PLAN.md
├── .github/
│   └── workflows/
│       ├── ci.yml              ← lint, typecheck, build (all apps)
│       └── deploy.yml          ← Vercel (web) + Railway (inference)
├── README.md
├── CLAUDE.md                   ← this file
├── package.json                ← Bun workspaces root
└── .cursor/                    ← Cursor IDE rules
```

---

## Key Rules (enforced in .cursor/rules/)
- No `src/` folder — ever
- Server Components by default — `'use client'` only when needed
- Tailwind v4: CSS-first, `@import "tailwindcss"` in globals.css, `@theme {}` for tokens
- DB queries MUST always filter by `tenantId` from session (never from request body)
- Encrypt before every write in the extension (AES-GCM, Web Crypto API)
- Extension: ARIA + data-attributes only — never CSS class selectors

---

## Environment Variables
Copy `apps/web/.env.example` → `apps/web/.env.local` and fill in:
- `DATABASE_URL` — from Neon dashboard (Neon: `ep-proud-sound-aoyz34le-pooler.c-2.ap-southeast-1.aws.neon.tech`)
- `AUTH_SECRET` — run: `openssl rand -base64 32`
- `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` — Google Cloud Console
- `UPSTASH_REDIS_REST_URL` + `_TOKEN`
- `UPSTASH_VECTOR_REST_URL` + `_TOKEN`
- `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY` + `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY` — from resend.com/api-keys
- `INFERENCE_SERVICE_URL` — local: `http://localhost:8000` / prod: Railway URL

⚠️ **DB push gotcha:** shell `DATABASE_URL` env var overrides `.env.local`.
Always run: `unset DATABASE_URL && bun run db:push`

## GitHub Actions Secrets Required
Add these in repo Settings → Secrets → Actions:
- `VERCEL_TOKEN` — for deploy.yml (Vercel deploy)
- `RAILWAY_TOKEN` — for deploy.yml (Railway inference deploy)

---

## Current Build Phase
**WEEK 1 — Foundation** ✅ COMPLETE

```
✅ Bun monorepo init + workspace config (apps/*, packages/*)
✅ apps/web — Next.js 15 App Router scaffold (TypeScript strict, no src/)
✅ Tailwind v4 + Shadcn/ui init (CSS-first, @theme tokens, dark surfaces)
✅ Neon DB setup + Prisma schema push (all tables live on Neon)
✅ Upstash Redis + Vector clients (lib/redis.ts, lib/vector.ts)
✅ NextAuth v5 skeleton (lib/auth.ts, session extended with tenantId + tier)
✅ packages/extension scaffold (MV3, vault.ts, extractor, anonymizer, observer)
✅ apps/inference FastAPI skeleton (main.py, graph/cache/auditor stubs)
```

---

**WEEK 2 — Core Pipeline** (current)

```
☐ Extension: media-capture.ts (canvas capture for images)
☐ Extension: xml-formatter.ts (Session → XML with CDATA)
☐ Extension: popup export UI (wire to xml-formatter)
☐ LangGraph: graph/workflow.py — StateGraph skeleton
☐ LangGraph: graph/router.py — GPT-4o-mini classifier
☐ LangGraph: graph/agents/deposit.py — first specialized agent
☐ Semantic cache: cache/semantic.py — Upstash Vector lookup + write
☐ API route: apps/web/app/api/chat/route.ts — Next.js → FastAPI proxy
☐ End-to-end test: query → router → agent → cache write → response
```

After Week 2: update this section to Week 3.

---

## Common Commands
```bash
# Dev
bun run dev                     # Next.js (turbopack)

# DB — always unset shell env first!
unset DATABASE_URL && bun run db:push       # push Prisma schema to Neon
unset DATABASE_URL && bun run db:generate   # regenerate Prisma client
bun run db:studio                           # Prisma Studio GUI

# Shadcn
bunx shadcn add button input card dialog table badge tabs

# Extension
cd packages/extension && bun run build

# Email preview
bun run email:dev               # localhost:3001

# Python
cd apps/inference
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Git
git add <files> && git commit -m "..." && git push
```

---

## Agents & Domains
| Agent | Domain | LoRA |
|-------|--------|------|
| Deposit | failed deposits, pending payments, balance credits | LoRA-01 |
| Withdrawal | withdrawal requests, limits, pending | LoRA-02 |
| Verification | KYC, identity docs, account verification | LoRA-03 |
| Onboarding | new accounts, registration, welcome bonus | LoRA-04 |
| General | everything else (catch-all) | LoRA-05 |

Router: GPT-4o-mini classifier → confidence < 0.7 always routes to General.

---

## Pricing Tiers
| Tier | Queries/month | Price |
|------|--------------|-------|
| Free | 500 | $0 |
| Starter | 10,000 | $149 |
| Growth | 50,000 | $499 |
| Enterprise | Unlimited | Custom |

OKBET: Growth tier, $0 for first 6 months (per signed agreement).
