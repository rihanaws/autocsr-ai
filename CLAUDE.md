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

```bash
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
| Billing | Polar |
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
- `POLAR_ACCESS_TOKEN` + `POLAR_WEBHOOK_SECRET` + `POLAR_PRODUCT_ID_STARTER` + `POLAR_PRODUCT_ID_GROWTH` + `POLAR_PRODUCT_ID_ENTERPRISE`
- `RESEND_API_KEY` — from resend.com/api-keys
- `INFERENCE_SERVICE_URL` — local: `http://localhost:8000` / prod: Railway URL

⚠️ **DB push gotcha:** shell `DATABASE_URL` env var always overrides `.env.local`.
Always prefix prisma commands with the Neon URL directly — never rely on dotenv-cli or bun run db:*:

```bash
DATABASE_URL='postgresql://neondb_owner:npg_kPcva1JKV4io@ep-proud-sound-aoyz34le-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' bunx prisma db push
DATABASE_URL='...' bunx prisma generate
DATABASE_URL='...' bunx prisma studio
```

## GitHub Actions Secrets Required
Add these in repo Settings → Secrets → Actions:
- `VERCEL_TOKEN` — for deploy.yml (Vercel deploy)
- `RAILWAY_TOKEN` — for deploy.yml (Railway inference deploy)

---

## Current Build Phase
**WEEK 1 — Foundation** ✅ COMPLETE

```text
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

**WEEK 2 — Core Pipeline** ✅ COMPLETE

```text
✅ Extension: media-capture.ts (canvas capture for images, attachment href logging)
✅ Extension: xml-formatter.ts (Session → XML with CDATA, full attr escaping via escAttr())
✅ Extension: popup export UI (XML + encrypted JSON export, live stats, 2s poll)
✅ Extension: observer.ts (wired to media-capture, stores encrypted snapshot to chrome.storage.local)
✅ LangGraph: graph/workflow.py — StateGraph with conditional dispatch
✅ LangGraph: graph/router.py — GPT-4o-mini classifier, confidence < 0.7 → GENERAL
✅ LangGraph: graph/agents/deposit.py — deposit specialized agent
✅ Semantic cache: cache/semantic.py — Upstash Vector lookup + write (0.92 threshold, tenant_id validated + post-query ownership check)
✅ API route: apps/web/app/api/chat/route.ts — Next.js → FastAPI proxy (auth-gated, tenantId injected)
✅ End-to-end test: pending manual Chrome load — all code complete
```

---

**WEEK 3 — Dashboard + Agent Expansion** ✅ COMPLETE

```text
✅ db:push/generate/studio/migrate — dotenv-cli wraps all prisma commands (loads .env.local)
✅ Agents: graph/agents/withdrawal.py — withdrawal specialized agent
✅ Agents: graph/agents/verification.py — KYC specialized agent
✅ Agents: graph/agents/onboarding.py — onboarding specialized agent
✅ Agents: graph/agents/general.py — catch-all agent
✅ Wire all 5 agents into workflow.py (stubs replaced)
✅ Guards: graph/guards/input_guard.py — scope filter + PII redaction
✅ Guards: graph/guards/output_guard.py — hallucination risk + PII leak scan + confidence scoring
✅ Auditor: auditor/judge.py — Claude Haiku async judge, 5% sample, asyncpg writes ReviewItem to Neon
✅ main.py v0.3.0 — full pipeline: input_guard → cache → workflow → output_guard → auditor
✅ Billing: app/api/webhooks/polar/route.ts — Polar webhook (subscription tier sync, NOT Stripe)
✅ Landing page: app/(marketing)/page.tsx — full 6-section marketing page (hero, problem, how-it-works, metrics, pricing, CTA)
✅ Landing: components/marketing/* — HeroSection (live counter), ProblemSection, HowItWorksSection (SVG flow), MetricsSection, PricingSection (annual toggle), CTASection
✅ Dashboard layout: app/(dashboard)/layout.tsx — auth-gated, sidebar with agent health dots + review badge count
✅ Dashboard overview: app/(dashboard)/dashboard/page.tsx — 4 KPI cards (live DB), 7d area chart (Recharts), live feed (SWR 3s poll)
✅ Dashboard agents: app/(dashboard)/agents/page.tsx — 30d stats table, SVG sparklines per agent
✅ Review queue: app/(dashboard)/review-queue/page.tsx + actions.ts — approve/correct/reject Server Actions
✅ Training page: app/(dashboard)/training/page.tsx — run history, accuracy trend chart, next-run countdown
✅ API: app/api/dashboard/feed/route.ts — auth-gated live feed endpoint
✅ postcss.config.mjs + @tailwindcss/postcss — Tailwind v4 PostCSS wired for Turbopack
☐ Email: welcome email via Resend + React Email template (moved to Week 4)
☐ Extension: load unpacked in Chrome, verify capture on LiveAgent session (E2E) (moved to Week 4)
```

---

**WEEK 3.5 — Auth + DB Hardening** ✅ COMPLETE (2026-06-05)

```text
✅ next.config.ts — serverComponentsExternalPackages moved to top-level serverExternalPackages
✅ app/(auth)/layout.tsx — minimal centered dark layout
✅ app/(auth)/login/page.tsx — Google OAuth + magic link, dark card design
✅ app/(auth)/signup/page.tsx — Google OAuth + company/email fields, matches login design
✅ lib/auth.ts — added Resend provider (from: noreply@techsci.co), removed dead Credentials stub
✅ lib/auth.ts — fixed session callback: Tenant query was WHERE id=userId (wrong) → WHERE userId=userId
✅ lib/auth.ts — added createUser event to auto-provision Tenant on first sign-in
✅ Neon DB schema re-synced (dropped stale cache_entries/cache_stats, all 10 tables live)
✅ Tenant rows backfilled for existing users (rihanawsacc@gmail.com, sayemrihan.com@gmail.com)
```

---

**WEEK 4 — Training Pipeline + Email + E2E**

```text
☐ Email: welcome email via Resend + React Email template
☐ Extension: load unpacked in Chrome, verify capture on LiveAgent session (E2E)
☐ Training pipeline: Unsloth QLoRA fine-tune script (pipeline/)
☐ Weekly scheduler: QStash cron → trigger training run
☐ Knowledge base page: app/(dashboard)/knowledge/page.tsx — chunk list, upload, delete
☐ Settings page: app/(dashboard)/settings/page.tsx — API key, tier display, danger zone
☐ Cache page: app/(dashboard)/cache/page.tsx — vector cache stats, manual invalidation
```

---

## Common Commands

```bash
# Dev
bun run dev                     # Next.js (turbopack)

# DB — scripts use dotenv-cli, loads .env.local automatically
bun run db:push                             # push Prisma schema to Neon
bun run db:generate                         # regenerate Prisma client
bun run db:migrate                          # create + apply migration
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
| --- | --- | --- |
| Deposit | failed deposits, pending payments, balance credits | LoRA-01 |
| Withdrawal | withdrawal requests, limits, pending | LoRA-02 |
| Verification | KYC, identity docs, account verification | LoRA-03 |
| Onboarding | new accounts, registration, welcome bonus | LoRA-04 |
| General | everything else (catch-all) | LoRA-05 |

Router: GPT-4o-mini classifier → confidence < 0.7 always routes to General.

---

## Pricing Tiers

| Tier | Queries/month | Price |
| --- | --- | --- |
| Free | 500 | $0 |
| Starter | 10,000 | $149 |
| Growth | 50,000 | $499 |
| Enterprise | Unlimited | Custom |

OKBET: Growth tier, $0 for first 6 months (per signed agreement).
