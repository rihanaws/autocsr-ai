# AutoCSR — Claude Code Context

## Document Authority (established 2026-06-10, ADR 0001)
Explicit hierarchy — eliminates multi-document state drift:

- **STATUS.md** → SINGLE source of truth for what is built/verified. Nothing else may assert completion status. A feature is done only when its STATUS.md verification command passes.
- **apps/web/DESIGN_SYSTEM.md** → SINGLE source of truth for visual tokens and component rules. Supersedes any visual guidance elsewhere.
- **CLAUDE.md** (this file) → Rules, conventions, stack, commands, and POINTERS to the above. Contains NO completion-status claims and NO duplicated token specs.
- **docs/decisions/** → Dated, append-only architecture decision records (ADRs). Read for "why", never for "current state". Never edited after writing.
- **docs/archive/ (session-state-\*, old reviews)** → Frozen historical handoffs. Archive, never source of truth.

If two documents conflict, authority order is: STATUS.md / DESIGN_SYSTEM.md > CLAUDE.md > docs/decisions/ > session-state-*. Lower-authority documents must never be used to override a higher one. When you complete or change project state, update STATUS.md FIRST.

## Project
AI-native CSR automation SaaS for online betting.
Owner: TechSci, Inc. / Sayem Abdullah Rihan
Client: OKBET (Gavin Ventures, Inc.) — Growth tier, free 6 months post-deploy
Repo: https://github.com/rihanaws/autocsr-ai (private, branch: main)

## Claude-Mem Context Startup

Before repository-wide analysis, use Claude-Mem.

Worker:
`http://127.0.0.1:37701`

Health:
`GET /api/health`

Readiness:
`GET /api/readiness`

Search:
`GET /api/search?query=<terms>`

Default startup searches:
- `autocsr`
- `autocsr security tenant isolation OKBET semantic cache`
- `autocsr production deployment Railway Vercel Dependabot`
- `autocsr inference pipeline upload chunk embed retrieve`

Do not scan the repository first. Use memory search results and observation IDs as the first context layer.

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
- Read apps/web/DESIGN_SYSTEM.md before writing any new UI component (skill file points there too)
- Do NOT set turbopack.root in next.config.ts — causes build failures
- global-error.tsx required in app/ for proper error boundaries

## Design System
See `apps/web/DESIGN_SYSTEM.md` — single source of truth for ALL visual tokens, fonts, and component rules (Document Authority). Legal hex values, font roles, dark-theme strategy, motion rules: defined ONLY there. Token-strategy "why": ADR `docs/decisions/0002-arbitrary-hex-canonical.md`.
- next/font vars (`--font-geist-sans` / `--font-inter` / `--font-jetbrains-mono`) intentionally differ from @theme tokens (`--font-body` etc.); identical names caused circular var() refs. Do not rename back.
- BRAND.md = voice/positioning/logo ONLY — never visual guidance.

## Build Status
See STATUS.md — single source of truth for what is built/verified (Document Authority). This file makes NO completion claims.

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

## Neon DB — Two endpoints (same project, SAME database)
- Pooler (used by app): `ep-proud-sound-aoyz34le-pooler.c-2.ap-southeast-1.aws.neon.tech`
- Non-pooler: `ep-proud-sound-aoyz34le.c-2.ap-southeast-1.aws.neon.tech`
- CORRECTED 2026-06-10: BOTH endpoints serve the same DB with ALL tables. Earlier "pooler has inference tables only (cache_entries, transactions)" was FALSE — that table list is the LOCAL claude_cache_db leaking in via shell DATABASE_URL (see Shell env leak section)
- If a connection shows cache_entries/transactions/webhook_logs/rate_history → wrong DB (local), fix env
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

## Inference Security (wired 2026-06-08, hardened 2026-06-08, Block 7 2026-06-09)
Auth: `Authorization: Bearer <INFERENCE_API_SECRET>` — fails-closed if secret missing.
Per-tenant API keys (Block B/C2, 2026-06-11): `/api/infer` accepts two auth paths. Path 1 — global `INFERENCE_API_SECRET` (internal web→inference, QStash). Path 2 — per-tenant `ak_live_*`/`ak_test_*` key, looked up via SHA-256 hash in `ApiKey` table (`_verify_tenant_api_key` in main.py); enforces `ApiKey.tenantId == body.tenant_id` (403 on mismatch), 401 on invalid/revoked/expired key. `lib/api-key.ts`: `generateApiKey`/`hashApiKey`/`isApiKey` (SHA-256, not bcrypt — high-entropy machine-generated keys). `Tenant.apiKey` plaintext field removed; dedicated `ApiKey` model (keyHash unique, prefix display, environment, revokedAt, expiresAt, lastUsedAt). `setup:okbet` provisions/rotates the per-tenant key, printed once, never stored raw. Settings UI shows prefix + issued date only (no rotate UI — contact support).
OKBET IP allowlist: DB-driven via `authorizedIps` on Tenant row — NOT hardcoded. setup:okbet writes correct IPs.
XFF parsing: `idx = len(entries) - TRUSTED_PROXY_HOPS - 1` — selects entry BEFORE proxy hop (rightmost = proxy itself).
IP validated via `ipaddress.ip_address()` before allowlist check — rejects malformed strings.
`TRUSTED_PROXY_HOPS=1` env var in `apps/inference/.env` (default: 1).
Secret shared: same value in `apps/web/.env.local` and `apps/inference/.env`.
`load_dotenv()` called at top of main.py — .env auto-loaded on startup.
X-Client-IP header removed from chat route — proxy chain handles XFF automatically.
QStash sig: HS256 JWT verified via `verify_qstash_signature(sig, url)` — checks iss=Upstash + sub=exact URL. Header: `Upstash-Signature`.
Prompt injection guard (Block C, 2026-06-11): `_check_injection()` in main.py, regex blocklist `_INJECTION_RE` — runs in `/api/infer` before cache lookup/agent dispatch. Match → 400 `{"code":"INJECTION_DETECTED"}`.
Query length cap: `MAX_QUERY_BYTES=2000` in main.py — oversized query → 400 `{"code":"QUERY_TOO_LONG"}`. Domain-scope filter remains `_is_csr_relevant` allowlist in `graph/guards/input_guard.py`.
Cache write-gating (Block D, 2026-06-11): `cache_write()` in `cache/semantic.py` returns `bool`, skips upsert (no exception) when response is empty/<10 chars, matches `_ERROR_INDICATORS` (refusal/error phrases), `confidence < CACHE_MIN_CONFIDENCE` (env, default 0.7), or query/response matches `_PII_RE` (card/account numbers, email, phone). Prevents low-quality/PII responses from poisoning shared semantic cache.

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
Security: QStash JWT (HS256) = sole auth for /api/training/weekly-trigger — header: Upstash-Signature
PILOT_TENANT_ID env var: set in inference/.env to OKBET tenant DB id — TrainingRun rows tagged with it
PIPELINE_DIR env var: set in inference/.env to absolute path of pipeline/ dir (default: relative to main.py)
convert.py: accepts PIPELINE_TENANT_ID env var to scope examples to one tenant
run_pipeline.py: fills all TrainingRun fields (examplesUsed, promoted, baseModelVersion, adapterVersion, startedAt set when status→RUNNING)

## API Auth Pattern (enforced 2026-06-08)
ALL API routes must use this guard — no exceptions:
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = session.user.tenantId
NEVER use redirect() in API routes — return 401 JSON instead.
All knowledge/cache/settings routes are auth-guarded. Cache-threshold + disconnect behavior: see "Cache Threshold + Billing Disconnect" below.

## QueryEvent Persistence (wired 2026-06-08)
create_query_event() in apps/inference/main.py writes to "QueryEvent" table for EVERY inference call.
Both cache-hit and full-inference paths write rows — dashboard analytics now have real data.
asyncpg pool initialized in FastAPI lifespan handler — stored at `app.state.db_pool`, reused across all requests. Never call `asyncpg.create_pool()` in a request handler.
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

## Knowledge Pipeline (wired 2026-06-10, commit a3ea0a8)
Flow: upload route → KnowledgeDocument row (PROCESSING) → POST inference `/api/knowledge/embed` (Bearer INFERENCE_API_SECRET) → background `_embed_and_store` → chunks upserted to Upstash Vector (`data=` text, index auto-embeds) + KnowledgeChunk rows in Neon → doc status READY/FAILED.
Chunking: `_chunk_text` in main.py — CHUNK_SIZE 512, OVERLAP 64 (2000 chars → 5 chunks, overlap math).
Retrieval: `retrieve_knowledge(query_text, tenant_id)` in cache/semantic.py — SYNC (callable from sync agent nodes), tenant-id validated, filter `type="knowledge" AND tenant_id=...` PLUS per-result metadata re-check (tenant_id + type, defense-in-depth, commit 0d28bff), min_score 0.72, returns [] on any failure. All 5 agents inject chunks into system prompt.
Embed endpoint input validation (0d28bff): tenantId via `_validate_tenant_id`, documentId via `_TENANT_ID_RE` ([A-Za-z0-9_-]{1,64}) — both concatenated into vector_id, 400 on bad input.
RESOLVED 2026-06-10: new Upstash Vector index AUTOCSR-AI-V2 (us-east-1, BAAI/bge-base-en-v1.5 built-in, 768-dim COSINE) — `striking-shiner-98922-us1-vector.upstash.io`. Creds updated in BOTH apps/web/.env.local and apps/inference/.env. Smoke-tested: upsert-data + query-data with metadata filter work. Old index (picked-eel-77052) had no embedding model — all `data=` calls rejected. NOTE: Upstash built-in models = BAAI/bge variants only.

## CRITICAL — Shell env leak (root-caused 2026-06-10)
User shell exports DATABASE_URL → localhost `claude_cache_db` (different project). `load_dotenv()` does NOT override existing env vars — so inference picks up the WRONG DB silently (QueryEvent/doc-status writes vanish; tables don't exist there).
This also clobbered schema.prisma once: `prisma db pull` ran with shell DATABASE_URL → introspected claude_cache_db → wiped all app models. Restored from HEAD + `bun run db:generate`.
RULES: start uvicorn with `set -a && source .env && set +a` first (see Commands). NEVER run `prisma db pull`. If typecheck suddenly loses Tier/tenant types → schema.prisma was clobbered, restore from git.

## Known Gaps
- 18 Dependabot pip alerts dismissed (2026-06-11, all in pipeline/requirements.txt — offline training job, not reachable via prod inference API): 15 transformers (trl==0.12.2 pin blocks upgrade to patched versions), 3 NLTK (no stable patch). Remaining 5 nltk/python-dotenv alerts pending rescan after nltk>=3.9.4 / python-dotenv>=1.2.2 bump. Check: `gh api /repos/rihanaws/autocsr-ai/dependabot/alerts --jq '[.[] | select(.state=="open")] | length'`

## Cache Threshold + Billing Disconnect (inference/web)
- cacheThreshold: main.py `get_tenant_config(pool, tenant_id)` — one Tenant query returns {authorized_ips, cache_threshold}; threshold passed to cache_lookup. FAIL-CLOSED: unknown tenant → 403; DB unreachable → 503 (caller maps non-HTTP exceptions); null cacheThreshold → 0.92 default only.
- cache/semantic.py: functions are `cache_lookup`/`cache_write` (NOT lookup/write); cache_lookup accepts `threshold` param (default SEMANTIC_CACHE_THRESHOLD env); cache entries tagged `type="cache"` in metadata AND filter — distinct from knowledge chunks in shared AUTOCSR-AI-V2 index (critical: without tag, knowledge chunks could match as cache hits).
- /demo page: `app/(marketing)/demo/page.tsx` — closed-pilot notice + signup CTA.
- disconnect endpoint: lists active Polar subs by customerId (= Tenant.stripeCustomerId — field stores POLAR customer id, rename deferred to Run F), `subscriptions.revoke` each (SDK 0.47.1 has revoke, NOT cancel), tier→FREE, nulls stripeCustomerId/stripeSubId, deletes `session:tenant:<userId>` Redis keys.

## CI Workflows (.github/workflows, updated 2026-06-11)
- ci.yml: typecheck/lint/build (web), ruff lint + format check (inference), extension build
- deploy.yml: Vercel (web) → Railway (inference) on push to main — VERCEL_TOKEN/VERCEL_ORG_ID/VERCEL_PROJECT_ID/RAILWAY_TOKEN in repo Actions secrets
- Node 24 in ALL workflow jobs — Vercel mandates Node ≥24 from 2026-06-16. Never downgrade.
- CI runs `ruff format --check` on apps/inference — run `ruff format .` there before committing Python
- apps/inference/ruff.toml: E402 ignored for main.py only (load_dotenv() must run before local imports)
- ci.yml env block must stub EVERY var in `lib/env.ts` schema (format-valid: `re_` prefix, `polar_whs_` prefix, UUIDs, ≥32-char secrets) — `next build` validates env at page-data collection

## Production Deploy (wired 2026-06-11)
- Web → Vercel: project `autocsr` (`prj_o3haPw87FQVf9REb3eJF0TOqcuwj`), team `rihanaws-projects` (`team_851vjgWFg6n9VyaIjHKpC7iM`), URL https://autocsr.vercel.app
  - Project rootDirectory = `apps/web`; vercel CLI MUST run from repo root (monorepo: turbopack infers workspace root from bun.lock — running inside apps/web breaks it). NEVER set turbopack.root.
  - `apps/web` build script = `prisma generate && next build` — Vercel has no separate generate step; without it $queryRaw generics collapse to any and typecheck fails
  - Production env vars seeded 2026-06-11 from .env.local with overrides: NEXTAUTH_URL/NEXT_PUBLIC_APP_URL → https://autocsr.vercel.app, AUTH_TRUST_HOST=true, INFERENCE_SERVICE_URL → Railway domain.
- Inference → Railway: project `distinguished-healing` (`eabb3346-5f19-44d6-ac9b-6108fb276ad1`), env `production` (`1f0d9b2e-8b6a-41ac-a0c1-237a6607cb10`), service `inference` (`190f4bb6-7939-4e46-9cc6-ba187bf8d9a4`), domain https://inference-production-e5c4.up.railway.app
  - `apps/inference/railway.json`: uvicorn start cmd ($PORT), /health healthcheck; `.python-version` pins 3.11
  - RAILWAY_TOKEN = project token `github-actions-deploy` (production-scoped)
  - Runtime vars seeded from apps/inference/.env (ALLOWED_ORIGIN → vercel URL). OPENAI_API_KEY + ANTHROPIC_API_KEY set 2026-06-11 via Railway CLI on `inference`/production — also added to apps/web/.env.local for local dev.
  - requirements.txt pins MUST be PyPI-verified (`pip install --dry-run -r requirements.txt`) — old pins were fictional (upstash-vector==1.1.6 never existed); PyJWT required (import jwt in main.py)
- Deploy status/completion claims: STATUS.md only.

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
cd apps/inference && set -a && source .env && set +a && /Users/rihan/.pyenv/versions/3.11.9/bin/python -m uvicorn main:app --reload --port 8000   # source .env FIRST — shell DATABASE_URL leak
cd pipeline && python run_pipeline.py <run_id> [agent_type]  # Manual pipeline trigger
