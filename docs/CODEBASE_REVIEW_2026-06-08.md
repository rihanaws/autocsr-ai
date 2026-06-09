# AutoCSR Codebase Review - 2026-06-08

## Scope

Reviewed project folder: `/Users/rihan/all-coding-project/autocsr`.

Inputs checked:

- `CLAUDE.md`
- `AGENTS.md`
- `session-state-2026-06-08.md`
- Current git state and recent commits
- Web app routes, dashboard pages, API routes, auth/env/db helpers
- Inference service, semantic cache, auditor
- Training pipeline
- Chrome extension package
- Local/generated files and verification commands

Current git state: clean. Last relevant commits:

- `578e4de` `chore: ignore .playwright-mcp/`
- `c8ad272` `chore: add codex config, serena config, AGENTS.md, codebase review, session state`
- `803e889` `fix(security): auth-guard all API routes + wire QueryEvent + fix pipeline`
- `048a320` `feat(dashboard): knowledge upload, cache controls, settings tabs`

## Current Understanding

AutoCSR is Bun monorepo for AI-native CSR automation.

- `apps/web`: Next.js 16 dashboard/marketing/auth app. NextAuth v5, Prisma 6, Neon, Polar, Upstash Redis/Vector, React Email.
- `apps/inference`: FastAPI inference service. Handles `/api/infer`, semantic cache, guards, auditor, QStash weekly trigger.
- `pipeline`: Python training package. Converts approved examples, fine-tunes adapter, evaluates, updates `TrainingRun`.
- `packages/extension`: MV3 Chrome extension for LiveAgent conversation capture/export.

Intended flow:

1. User signs in; NextAuth creates user session and tenant.
2. Web `/api/chat` adds `tenant_id` from session and forwards query to inference with bearer secret.
3. Inference checks IP allowlist for OKBET, applies input guard, checks semantic cache, runs LangGraph agent, applies output guard.
4. Inference writes `QueryEvent`, writes semantic cache, schedules auditor.
5. Dashboard reads `QueryEvent`, `ReviewItem`, `KnowledgeChunk`, `KnowledgeDocument`, `TrainingRun`, `TrainingExample`.
6. QStash hits inference weekly trigger; inference creates `TrainingRun` and starts `pipeline/run_pipeline.py`.
7. Pipeline filters approved examples by tenant/agent, trains/evaluates, updates run status.
8. Chrome extension captures LiveAgent sessions, exports encrypted/XML data.

Big state change since previous review: API auth, `QueryEvent` persistence, and pipeline tenant/path fixes mostly landed. Remaining major gaps: extension still broken, knowledge upload does not create usable knowledge, cache controls do not fully control inference cache, OKBET IP allowlist logic still wrong, verification scripts still broken.

## Findings

### Critical

`apps/inference/main.py:L65-L79`: 🔴 bug: `get_real_client_ip()` reads index `len(entries) - TRUSTED_PROXY_HOPS`, so `TRUSTED_PROXY_HOPS=1` returns trusted proxy IP, not real client IP. Use `len(entries) - TRUSTED_PROXY_HOPS - 1`, validate bounds, and fall back safely.

`apps/inference/main.py:L169-L173`: 🔴 bug: OKBET IP allowlist applies only when `body.tenant_id == "okbet"`, but web sends `session.user.tenantId` UUID in `apps/web/app/api/chat/route.ts:L41-L44`. Enforce by DB tenant id/slug mapping, not request string.

`apps/inference/main.py:L46-L51`: 🔴 bug: `OKBET_ALLOWED_IPS` contains `"153.53.81"` but project docs list `153.53.253.81`. Fix allowlist and avoid prefix pseudo-CIDR unless explicitly configured.

`packages/extension/manifest.json:L23-L27`: 🔴 bug: extension build fails because `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` are missing. Add icon assets or remove icon block.

`packages/extension/src/background/service-worker.ts:L7-L14`: 🔴 bug: start/stop messages only return `{ ok: true }`; no tab/content-script lifecycle, no tenant id stored, no capture control. Store `autocsr_tenant_id`/active state and relay start/stop/snapshot.

`packages/extension/src/content/observer.ts:L67-L70`: 🔴 bug: capture defaults to tenant `"unknown"`. Block capture until tenant id exists in `chrome.storage.session`.

### High

`apps/web/app/api/knowledge/upload/route.ts:L31-L41`: 🔴 bug: upload only creates `KnowledgeDocument` with `PROCESSING`; it never stores file, parses content, chunks, embeds, updates status/chunk count, or creates `KnowledgeChunk`. Add storage + parse/chunk/embed worker, or mark feature disabled.

`apps/web/app/(dashboard)/knowledge/page.tsx:L50-L57`: 🔴 bug: documents count hardcoded `0` while upload persists `KnowledgeDocument`. Query document count and show actual status.

`apps/web/app/(dashboard)/knowledge/actions.ts:L21-L28`: 🟡 risk: manual knowledge chunk writes no embedding. Agents/vector search cannot use it unless another process embeds later. Add embedding on chunk create or a backfill job.

`apps/web/app/api/cache/clear/route.ts:L18-L25`: 🔴 bug: failed vector reset returns success. Return non-2xx on reset failure and surface error in UI.

`apps/web/app/api/cache/entries/route.ts:L3-L5`: 🔴 bug: cache entries endpoint is unauthenticated stub. Add auth + tenant namespace listing or remove route.

`apps/web/app/(dashboard)/cache/page.tsx:L203-L204`: 🔴 bug: threshold card hardcodes `0.92`; tenant `cacheThreshold` from Prisma is ignored. Query tenant threshold and pass real value.

`apps/inference/cache/semantic.py:L10`: 🔴 bug: inference reads `SEMANTIC_CACHE_THRESHOLD` env once; web writes `Tenant.cacheThreshold`. Runtime threshold setting has no effect. Load tenant threshold or sync env/cache config.

`apps/web/app/(dashboard)/cache/page.tsx:L185-L200`: 🟡 risk: UI documents `DELETE /api/cache/{queryHash}`, but only `DELETE /api/cache/clear` exists. Add per-entry route or fix docs.

`apps/web/app/(dashboard)/settings/billing/page.tsx:L35-L44`: 🔴 bug: UI shows Starter `$49/mo` and Growth `$199/mo`; `CLAUDE.md` says Polar products are `$149/mo` and `$499/mo`. Fix pricing display.

`apps/web/components/dashboard/settings-tabs.tsx:L29-L55`: 🔴 bug: IP list starts empty, never fetches persisted `authorizedIps`, and mutates local state without checking response. Fetch on mount/SWR and update only after `res.ok`.

`apps/web/app/api/settings/authorized-ips/route.ts:L5`: 🟡 risk: IP regex accepts invalid IPv4 like `999.999.999.999` and `/99` if shape fits until `/d{1,2}`. Use real IP/CIDR parser.

`apps/web/app/api/settings/authorized-ips/route.ts:L33-L36`: 🟡 risk: `push` allows duplicate IPs and races. Deduplicate server-side and return full list.

`apps/web/app/api/settings/danger-zone/disconnect/route.ts:L11-L15`: 🔴 bug: disconnect endpoint returns scheduled message but does not cancel Polar subscription, revoke API key, delete tenant data, or enqueue job. Implement real deprovision flow or disable button.

`apps/web/components/dashboard/settings-tabs.tsx:L249-L254`: 🔴 bug: UI marks disconnect done after any response. Check `res.ok`, show failure, and require server-side confirmation token.

`apps/inference/main.py:L302-L309`: 🟡 risk: custom QStash signature verifier may not match Upstash QStash JWT-style signatures in production. Use official `Receiver`/SDK verification or verify against actual delivered header.

`apps/inference/main.py:L311-L319`: 🟡 risk: active training guard is global. One active tenant blocks all tenants. Scope by `tenantId` if training is per tenant.

`pipeline/run_pipeline.py:L21-L25`: 🟡 risk: `startedAt` never set when run starts. Update `startedAt=NOW()` on `RUNNING` for dashboard accuracy.

`pipeline/run_pipeline.py:L78-L85`: 🟡 risk: training example count silently becomes `0` if file path wrong. Fail run or log error; `0 examples` hides pipeline bug.

`pipeline/promote.py:L16-L34`: 🟡 risk: stale standalone promote script updates fewer fields than `run_pipeline.py`. Remove it or align with current schema (`examplesUsed`, `promoted`, versions).

### Medium

`apps/web/components/dashboard/cache-controls.tsx:L17-L23`: 🟡 risk: clear cache button ignores response and always says `Cleared`. Check `res.ok`, show error, keep dialog open on failure.

`apps/web/components/dashboard/cache-controls.tsx:L112-L114`: 🔵 nit: threshold number uses negative letter spacing; project rules say numbers/timestamps font-mono, no negative tracking. Remove `letterSpacing: '-0.04em'`.

`apps/web/components/dashboard/settings-tabs.tsx:L128-L130`: 🔵 nit: IP `Added` column uses `new Date()` for every row, so all rows show today's date. Store `createdAt` with allowlist entries or remove column.

`apps/web/components/dashboard/settings-tabs.tsx:L241-L247`: 🟡 risk: clear training data UI says `Scheduled`, but API deletes synchronously and returns count. Show `deleted` count or real job status.

`apps/web/app/(dashboard)/training/page.tsx:L8-L15`: 🟡 risk: `TRAINING` enum state exists but style map lacks `TRAINING`; UI falls back to queued style during fine-tune. Add `TRAINING` style.

`apps/web/app/(dashboard)/training/page.tsx:L95-L101`: 🟡 risk: `evalDelta` displayed but pipeline never computes it. Compute delta against previous promoted run or remove column.

`apps/web/app/api/settings/api-key/route.ts:L17-L18`: 🟡 risk: empty/missing API key returns `••••`; user sees fake key. Return 404/500 or generate key.

`apps/web/app/api/chat/route.ts:L36-L39`: 🟡 risk: `clientIp` is computed but sent as `X-Client-IP`; inference ignores it and reads `X-Forwarded-For`. Either forward expected header through trusted proxy chain or remove dead header.

`apps/inference/auditor/judge.py:L149-L160`: 🟡 risk: `schedule_audit()` swallows scheduling errors. Log failure so auditor outages show up.

`apps/inference/auditor/judge.py:L118-L135`: 🟡 risk: new asyncpg pool per sampled audit. Reuse shared pool or pass pool from inference.

`apps/web/scripts/register-qstash-cron.ts:L7-L13`: 🟡 risk: idempotency only checks destination substring. If ngrok changes to Railway, old schedule blocks new registration. Match exact destination and update/delete stale schedules.

`apps/web/lib/env.ts:L23`: 🟡 risk: `NODE_ENV` is required in schema; `bun run cron:register --help` failed because `NODE_ENV` undefined. Give default or set in script.

`apps/web/package.json:L11-L13`: 🟡 risk: DB scripts still use `dotenv-cli`, despite `CLAUDE.md` saying dotenv-cli is broken. Replace with Bun `--env-file` wrappers or documented safe commands.

`apps/web/package.json:L9`: 🔴 bug: `next lint` is invalid with current Next 16 setup; `bun run lint` fails. Replace with `eslint .`.

`package.json:L5-L10`: 🔴 bug: root has no `typecheck` or `lint`; `bun run typecheck` fails and `bun run lint` invokes unrelated system Android lint. Add root scripts.

`apps/web/app/(dashboard)/settings/billing/page.tsx:L70-L76`: 🟡 risk: selects `stripeCustomerId` in Polar app. Rename schema/field to Polar or stop selecting unused Stripe field.

`apps/web/app/api/webhooks/polar/route.ts:L39`: 🟡 risk: webhook logs full event payload. Scrub or disable in production.

### Low / Hygiene

`.gitignore:L55-L60`: `.playwright-mcp/` and `apps/web/tsconfig.tsbuildinfo` ignored, good. `.serena/project.local.yml` ignored via `.serena/.gitignore`. `.codex/` is tracked by commit; decide if desired.

Local ignored/generated artifacts still present:

- `.DS_Store`
- `.claude/settings.local.json`
- `.serena/project.local.yml`
- `.playwright-mcp/*`
- `apps/web/.next/*`
- `apps/web/.env`, `apps/web/.env.local`
- `apps/inference/.env`
- Python `__pycache__`
- `apps/inference/.ruff_cache/*`

No issue if intentionally ignored. Clean before packaging/deploy artifacts.

## New / Modified File Check

Git tree is clean now. No uncommitted new/modified tracked files.

Recent new/changed areas reviewed:

- `apps/web/app/api/cache/*`
- `apps/web/app/api/knowledge/*`
- `apps/web/app/api/settings/*`
- `apps/web/components/dashboard/cache-controls.tsx`
- `apps/web/components/dashboard/settings-tabs.tsx`
- `apps/web/components/dashboard/knowledge/upload-dialog.tsx`
- `apps/web/types/knowledge.ts`
- `apps/inference/main.py`
- `pipeline/*`
- `packages/extension/*`
- `CLAUDE.md`
- `session-state-2026-06-08.md`

Previous critical API auth findings are fixed in current code: cache, knowledge, settings, and danger-zone API routes now call `auth()` and use `session.user.tenantId`.

## Cross-System Gaps

### Dashboard ↔ Inference

`QueryEvent` write path now exists. Remaining mismatch: OKBET allowlist likely never applies because web sends UUID tenant id, while inference checks literal `"okbet"`.

### Cache UI ↔ Semantic Cache

Dashboard persists tenant threshold, but inference reads env threshold. Clear-all UI catches vector reset failures as success. Cache entry listing/per-entry invalidation still missing.

### Knowledge UI ↔ Agent Answers

Manual chunks and uploaded documents do not create embeddings. No retrieval path in agents was found. Knowledge Base can collect rows, but likely does not improve answers yet.

### Settings IP Allowlist ↔ Inference

Dashboard stores `Tenant.authorizedIps`; inference uses hardcoded `OKBET_ALLOWED_IPS`. User-configured IPs do not affect inference authorization.

### Billing Docs ↔ UI

Docs/Polar IDs say `$149/$499`; billing UI says `$49/$199`. Mismatch visible to paying users.

### Extension ↔ Training Pipeline

Extension exports session data, but no ingestion endpoint converts it into `TrainingExample`. Extension also fails build before ingestion can matter.

### QStash ↔ Pipeline

Pipeline path and tenant env improved. Remaining concerns: signature verification compatibility, global active-run lock, no `startedAt`, no delta calculation.

## Verification

Commands run from `/Users/rihan/all-coding-project/autocsr`.

```bash
bun run typecheck
```

Failed:

```text
error: Script not found "typecheck"
```

```bash
bun run lint
```

Failed. Root script missing, shell resolved unrelated Android `lint` executable and exited code `2`.

```bash
cd apps/web && bun run typecheck
```

Passed:

```text
$ tsc --noEmit
```

```bash
cd apps/web && bun run lint
```

Failed:

```text
$ next lint
Invalid project directory provided, no such directory: /Users/rihan/all-coding-project/autocsr/apps/web/lint
```

```bash
cd apps/web && bun run build
```

Passed, but warned:

```text
Next.js inferred your workspace root...
selected /Users/rihan/pnpm-lock.yaml
Detected additional lockfiles:
* /Users/rihan/all-coding-project/autocsr/bun.lock
```

Do not set `turbopack.root` per project rules. Better remove/relocate stray `/Users/rihan/pnpm-lock.yaml` if not needed.

```bash
cd packages/extension && bun run build
```

Failed:

```text
[crx:manifest-post] ENOENT: Could not load manifest asset "icons/icon16.png".
```

```bash
cd apps/web && bun run cron:register --help
```

Failed before help:

```text
ZodError: NODE_ENV Required
```

## Priority Fix Plan

1. Fix inference real-client-IP extraction and OKBET tenant matching.
2. Fix extension icons, service worker, tenant id storage, observer capture gating.
3. Wire settings `authorizedIps` into inference instead of hardcoded IP list.
4. Wire knowledge upload/manual chunk to storage, chunking, embedding, retrieval, and document status updates.
5. Make cache clear/threshold/entries real end-to-end: tenant threshold in inference, reset failure handling, per-entry invalidation.
6. Fix billing prices to `$149/$499`.
7. Fix root and web lint/typecheck scripts; remove `dotenv-cli` from DB/cron scripts.
8. Fix QStash verification with official SDK and scope active-run lock by tenant.
9. Add `TRAINING` style, compute `evalDelta`, set `startedAt`, and align/remove stale `promote.py`.
10. Add extension ingestion path to create reviewed `TrainingExample` rows.
