# AutoCSR — Claude Code Context

## Project
AI-native CSR automation SaaS for online betting.
Owner: TechSci, Inc. / Sayem Abdullah Rihan
Client: OKBET (Gavin Ventures, Inc.) — Growth tier, free 6 months post-deploy
Repo: https://github.com/rihanaws/autocsr-ai (private, branch: main)

## CRITICAL — Package Manager
Always bun. Never npm/yarn/pnpm.
`bun install` | `bun add <pkg>` | `bun run <script>` | `bunx <bin>`

## CRITICAL — Database
Never call prisma directly. Always use `bun run db:*` scripts.
dotenv-cli BROKEN (Python 3.11 removed from Homebrew) — scripts fail with env from wrong source.
For db:push use: `DATABASE_URL="<neon-pooler-url>" bunx prisma db push`
For one-off scripts: `NODE_ENV=development bun --env-file=.env.local run <script>`

## Stack
Runtime: Bun | Frontend: Next.js 16 App Router (NO src/ folder)
Language: TypeScript strict | UI: Shadcn/ui + Tailwind CSS v4
Animation: Motion — import from 'motion/react'
DB: Neon PostgreSQL + Prisma 6 | Cache: Upstash Redis + Vector
Queue: Upstash QStash | Auth: NextAuth.js v5 | Billing: Polar (sandbox)
Email: Resend + React Email | Inference: FastAPI Python 3.11 + LangGraph
Model: Hermes-3-Llama-3.1-8B + LoRA adapters

## Key Rules
- No src/ folder — ever
- Server Components default — 'use client' only for interactivity
- Tailwind v4: @import "tailwindcss" in globals.css, @theme {} for tokens
- DB queries MUST filter by tenantId from session (never from request body)
- ALL numbers/timestamps/agent names → font-mono (JetBrains Mono) — no exceptions
- Extension: ARIA + data-attributes only, never CSS class selectors
- Read .claude/skills/design-system.md before writing any new UI component
- Do NOT set turbopack.root in next.config.ts — causes build failures
- global-error.tsx required in app/ for proper error boundaries

## Design Tokens (use exact values — no Tailwind color-* for custom colors)
bg-void:#060608 | bg-base:#090910 | bg-surface:#0f0f18 | bg-surface-2:#141420 | bg-surface-3:#1a1a28
border:rgba(255,255,255,0.06) | border-strong:rgba(255,255,255,0.12) | accent-hover:#4338ca
accent-glow:rgba(79,70,229,0.12) | accent-border:rgba(79,70,229,0.25)
text:#e8e8f0 | text-sub:#606075 | text-dim:#30303f
accent:#4f46e5 | green:#22c55e | amber:#f59e0b | red:#ef4444 | blue:#3b82f6
font-display:Geist 700 (var: --font-geist-sans) | font-body:Inter | font-mono:JetBrains Mono

## Build Status
Weeks 1–4: COMPLETE (dashboard, auth, billing, landing, email)
Week 5: IN PROGRESS
Week 5 DONE: env hardening, OKBET pilot config, training pipeline, QStash cron, dashboard pages, API auth guard pass, QueryEvent persistence, pipeline correctness fixes, Block 3.5 security fixes, Block 4 Chrome extension fixes, Block 5 UI correctness, Block 6 repo hygiene
Week 5 remaining: Run F (production deploy prep)
Week 5 ALSO DONE (June 9): font system (Geist+Inter npm), SEO metadata, robots.txt, sitemap.ts, legal pages (terms/privacy/refund), BRAND.md, MASTER_PLAN amended, footer with legal links, OG image

## Email — Welcome (wired 2026-06-05)
Template: `emails/welcome.tsx` — React Email, dark theme
Singleton: `lib/resend.ts`
Triggered: `lib/auth.ts` createUser event, after Tenant row created
From: AutoCSR <noreply@techsci.co> | Subject: "Welcome to AutoCSR — your pilot is ready"
Error-safe: try/catch — email failure does not block user creation
Preview: `bun run email:dev` → localhost:3001

## Polar Sandbox — Billing (wired 2026-06-05)
Products live in Polar sandbox org `d86c3924-e933-4322-ab4a-83370cc25f1c`:
- Starter: `1500891c-b6ef-4270-9dea-acee7f679cc7` ($149/mo)
- Growth:  `f3459e45-a3f7-4355-ad00-85cd1d8d1365` ($499/mo)
- Enterprise: `e40620eb-cb27-4577-81a2-1b6c88f2601a` (free placeholder)
Webhook endpoint ID: `af9d750c-9284-462e-8bb8-db9e9d568667`
Checkout: Server Action in `app/(dashboard)/settings/billing/actions.ts`
Webhook handler: `app/api/webhooks/polar/route.ts` — matches on `customer.externalId` (=tenantId)
CRITICAL: Polar sends tenantId as `customer.externalId`, NOT `customerId` — match on `id` first

## Neon DB — Two endpoints (same project)
- Pooler (used by app): `ep-proud-sound-aoyz34le-pooler.c-2.ap-southeast-1.aws.neon.tech` — has inference tables only (cache_entries, transactions, etc.)
- Non-pooler (auth/app tables): `ep-proud-sound-aoyz34le.c-2.ap-southeast-1.aws.neon.tech` — has Tenant, User, Session, etc.
- App DB queries work because Prisma uses pooler with ?channel_binding=require; psql direct queries need non-pooler URL
- Tables: Account, KnowledgeChunk, KnowledgeDocument, QueryEvent, ReviewItem, Session, Tenant, TrainingExample, TrainingRun, User, VerificationToken
- Tenant model additions (2026-06-08): cacheThreshold Float @default(0.92), authorizedIps String[] @default([])

## ngrok (local dev tunneling)
Static URL: `https://foziest-prius-maranda.ngrok-free.dev`
Web (port 3000): `ngrok http --url=foziest-prius-maranda.ngrok-free.dev 3000`
Inference/QStash (port 8000): `ngrok http --url=foziest-prius-maranda.ngrok-free.dev 8000`
Config: `~/Library/Application Support/ngrok/ngrok.yml`
CRITICAL: QStash weekly trigger fires to port 8000 — tunnel port 8000, not 3000.

## Env Validation — lib/env.ts (wired 2026-06-08)
All process.env.X replaced with typed `env.X` from `lib/env.ts` (Zod schema).
Throws at startup if any required var is missing or malformed.
Add new vars to BOTH `lib/env.ts` schema AND `.env.local`.
Depends on `zod` — now a DIRECT dep in apps/web/package.json (added 2026-06-08; was previously phantom/transitive-only, which broke clean `next build`).

## Inference Security (wired 2026-06-08, hardened 2026-06-08)
Auth: `Authorization: Bearer <INFERENCE_API_SECRET>` — fails-closed if secret missing.
OKBET IP allowlist: DB-driven via `authorizedIps` on Tenant row — NOT hardcoded. setup:okbet writes correct IPs.
XFF parsing: `idx = len(entries) - TRUSTED_PROXY_HOPS - 1` — selects entry BEFORE proxy hop (rightmost = proxy itself).
IP validated via `ipaddress.ip_address()` before allowlist check — rejects malformed strings.
`TRUSTED_PROXY_HOPS=1` env var in `apps/inference/.env` (default: 1).
Secret shared: same value in `apps/web/.env.local` and `apps/inference/.env`.
`load_dotenv()` called at top of main.py — .env auto-loaded on startup.
X-Client-IP header removed from chat route — proxy chain handles XFF automatically.

## Training Pipeline (wired 2026-06-08, corrected 2026-06-08)
Location: `pipeline/` — standalone Python package, run inside inference VM
Files: `config.py` | `convert.py` | `finetune.py` | `evaluate.py` | `promote.py` | `run_pipeline.py`
Flow: convert → finetune (QLoRA/Unsloth) → evaluate (BLEU ≥ 0.65) → promote TrainingRun in Neon
Replay buffer: 70% old examples + 30% new — sorted by createdAt ASC, THEN split (temporal correctness)
Triggered by: `/api/training/weekly-trigger` in inference (QStash webhook, Sunday 02:00 UTC)
QStash cron: `bun run cron:register` (apps/web) — idempotent, registers Sunday 02:00 UTC schedule
QStash cron ID: `scd_774mX3PfErmkHCEDcjedjkG7Vs4s` — fires Sunday 02:00 UTC → ngrok:8000
CRITICAL: ngrok must tunnel port 8000 (not 3000) when QStash fires, or update cron destination to Railway URL
inference/.env already has QSTASH keys + DATABASE_URL filled from .env.local values
Idempotency guard: trigger returns 409-style skip if any run in QUEUED/RUNNING/TRAINING/EVALUATING
Security: QStash sig = sole auth for /api/training/weekly-trigger (no Bearer header sent)
PILOT_TENANT_ID env var: set in inference/.env to OKBET tenant DB id — TrainingRun rows tagged with it
PIPELINE_DIR env var: set in inference/.env to absolute path of pipeline/ dir (default: relative to main.py)
convert.py: accepts PIPELINE_TENANT_ID env var to scope examples to one tenant
run_pipeline.py: fills all TrainingRun fields (examplesUsed, promoted, baseModelVersion, adapterVersion)

## API Auth Pattern (enforced 2026-06-08)
ALL API routes must use this guard — no exceptions:
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = session.user.tenantId
NEVER use redirect() in API routes — return 401 JSON instead.
All knowledge/cache/settings routes are auth-guarded. NOTE: auth + tenant scoping is done, but several routes are still functional stubs — see Known Gaps below (knowledge upload, cache threshold, disconnect).

## QueryEvent Persistence (wired 2026-06-08)
create_query_event() in apps/inference/main.py writes to "QueryEvent" table for EVERY inference call.
Both cache-hit and full-inference paths write rows — dashboard analytics now have real data.
Shared asyncpg pool (_db_pool) reused across requests — not recreated per call.
query_event_id passed to schedule_audit() → judge.py links ReviewItem back to QueryEvent row.

## OKBET Tenant Setup
Script: `bun run setup:okbet` (apps/web)
Run after OKBET admin signs up at /signup — promotes their auto-provisioned tenant to GROWTH tier.
Tenant must exist first (created on first login). Neon MCP can verify: SELECT * FROM "Tenant".
Writes authorizedIps: ["153.53.253.81", "89.117.176.115", "103.170.173.26"] — inference IP check is DB-driven.

## Chrome Extension (wired 2026-06-08)
Build: `cd packages/extension && bun run build` — clean, icons present in dist/
Icons: `packages/extension/icons/` — 1px placeholder PNGs, regenerate with `node scripts/gen-icons.mjs`
tenantId flow: popup → SESSION_START message → service-worker stores in chrome.storage.session → observer reads async
Observer blocks capture entirely if tenantId not set — no "unknown" tenant data ever written
Popup setup UI: shown automatically when tenantId not configured; user pastes UUID, clicks Save

## ESLint Config (fixed 2026-06-08)
Config: `apps/web/eslint.config.mjs` — uses `eslint-config-next` flat array directly (NOT FlatCompat).
FlatCompat removed: caused circular-ref crash in ESLint v10 + eslint-config-next v16.
react.version set to "19" in settings; react-hooks/purity disabled (false positive on Date.now() in RSCs).
Run: `bun run lint` from repo root or `bunx eslint app components lib types` from apps/web.
Next.js 16 dropped `next lint` command — use `eslint` directly.

## QStash Cron Idempotency (improved 2026-06-08)
`scripts/register-qstash-cron.ts` now does exact URL match + stale schedule cleanup.
Stale schedules (e.g. old ngrok URLs) deleted before registering new one.
Idempotent: exits early if exact TRIGGER_URL already registered.

## Known Gaps (Blocks 7–10 — not yet fixed)
- CRITICAL: workflow.invoke() in main.py is SYNC — blocks uvicorn event loop. Fix: await workflow.ainvoke()
- CRITICAL: weekly trigger creates new asyncpg pool instead of reusing _db_pool — connection leak
- HIGH: QStash signature verification uses raw HMAC — should be JWT (HS256) verify with @upstash/qstash
- HIGH: knowledge upload is a dead stub — no chunking, no embedding, no retrieval wired
- HIGH: Tenant.cacheThreshold stored in DB but inference reads env var only — setting has no effect
- HIGH: /demo page is a 404 — hero CTA links to it
- MEDIUM: session callback hits Neon on every getSession() — needs Redis cache (60s TTL)
- MEDIUM: disconnect endpoint returns stub — no Polar cancel, no data deletion
- MEDIUM: console.log(event) in polar webhook dumps full customer data to prod logs
- 24 Dependabot vulnerabilities (medium priority). Check: `gh api /repos/rihanaws/autocsr-ai/dependabot/alerts`

## Commands
bun run dev           # Next.js turbopack
bun run typecheck     # tsc --noEmit — delegates to apps/web; run after every TS change
bun run lint          # eslint app components lib types — delegates to apps/web
bun run db:push       # Prisma schema → Neon
bun run db:generate   # regenerate Prisma client
bun run db:studio     # Prisma Studio GUI
bun run email:dev     # React Email preview at localhost:3001
bun run setup:okbet   # Promote OKBET tenant to GROWTH (run after first login)
bun run cron:register # Register QStash weekly training cron (idempotent, exact URL match, stale cleanup)
cd packages/extension && bun run build
cd apps/inference && /Users/rihan/.pyenv/versions/3.11.9/bin/python -m uvicorn main:app --reload --port 8000
cd pipeline && python run_pipeline.py <run_id> [agent_type]  # Manual pipeline trigger
