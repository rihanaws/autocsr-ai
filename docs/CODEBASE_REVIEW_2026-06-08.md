# AutoCSR Codebase Review - 2026-06-08

## Scope

Reviewed entire project folder at `/Users/rihan/all-coding-project/autocsr`, with extra focus on uncommitted/new files:

- Modified: `apps/web/app/(dashboard)/cache/page.tsx`, `apps/web/app/(dashboard)/knowledge/page.tsx`, `apps/web/app/(dashboard)/settings/page.tsx`
- New: `apps/web/app/api/cache/*`, `apps/web/app/api/knowledge/*`, `apps/web/app/api/settings/*`, `apps/web/components/dashboard/cache-controls.tsx`, `apps/web/components/dashboard/knowledge/upload-dialog.tsx`, `apps/web/components/dashboard/settings-tabs.tsx`, `apps/web/types/knowledge.ts`
- Also checked: web auth/db/billing/chat, inference service, training pipeline, Chrome extension, generated/local artifacts.

## Current Understanding

AutoCSR is a Bun monorepo:

- `apps/web`: Next.js 16/React 19 dashboard, auth via NextAuth v5, Neon/Prisma 6, Polar billing, Upstash Redis/Vector clients, React Email.
- `apps/inference`: FastAPI service handling `/api/infer` and QStash-triggered `/api/training/weekly-trigger`.
- `pipeline`: standalone Python training pipeline: convert approved examples, QLoRA fine-tune, evaluate, promote/reject adapter.
- `packages/extension`: MV3 Chrome extension for LiveAgent CSR conversation capture/export.

Intended flow:

1. User signs in to web app. NextAuth creates `Tenant`.
2. Dashboard calls `/api/chat`.
3. Web route adds tenant from session and forwards request to inference with bearer secret.
4. Inference routes query to agent, checks semantic cache, writes cache, schedules auditor.
5. Dashboard reads `QueryEvent`, `ReviewItem`, `KnowledgeChunk`, `TrainingRun`, `TrainingExample`.
6. QStash cron hits inference weekly trigger, creates `TrainingRun`, starts pipeline.
7. Pipeline reads approved `TrainingExample`, fine-tunes adapter, updates `TrainingRun`.
8. Extension captures LiveAgent sessions for training/export.

Main issue: many dashboard surfaces assume persisted operational data, but current service paths either do not write those rows or stub success without persistence.

## Findings

### Critical

`apps/web/app/api/cache/clear/route.ts:L3`: unauthenticated destructive endpoint returns `{ cleared: true }` without tenant check or cache delete. Add `auth()`, require `session.user.tenantId`, delete tenant namespace in Upstash Vector, return real count/result.

`apps/web/app/api/cache/threshold/route.ts:L3`: unauthenticated config endpoint accepts threshold and returns success without persistence. Add auth, tenant-scoped storage column/key, and inference-side read path.

`apps/web/app/api/knowledge/upload/route.ts:L6`: unauthenticated upload endpoint accepts files from anyone and returns fake processing id. Add auth, file size limit, tenant-scoped storage, parsing/chunking/embedding job, and real document record.

`apps/web/app/api/knowledge/[id]/route.ts:L3`: unauthenticated delete endpoint returns success for arbitrary id. Add auth and delete only tenant-owned document/vector/storage records.

`apps/web/app/api/settings/authorized-ips/route.ts:L5`: unauthenticated IP allowlist endpoint exposes GET/POST without tenant. Add auth, validate IP/CIDR, persist tenant-owned allowlist, and use it in inference.

`apps/web/app/api/settings/authorized-ips/[ip]/route.ts:L5`: unauthenticated DELETE returns success for any path value. Add auth and tenant-scoped delete.

`apps/web/app/api/settings/danger-zone/clear-training/route.ts:L3`: unauthenticated danger endpoint returns scheduled success. Add auth, confirmation server-side, tenant-scoped `TrainingExample` deletion/job.

`apps/web/app/api/settings/danger-zone/disconnect/route.ts:L3`: unauthenticated danger endpoint returns scheduled success. Add auth, confirmation server-side, tenant deprovision/subscription cancel flow.

`apps/inference/main.py:L236`: weekly trigger starts `python pipeline/run_pipeline.py` relative to current working dir; documented run command is `cd apps/inference && uvicorn main:app`, so path resolves to missing `apps/inference/pipeline/run_pipeline.py`. Use absolute repo path/env `PIPELINE_DIR`, or set `cwd` to repo root and invoke real script.

`apps/inference/main.py:L230`: `TrainingRun` inserted without `tenantId`; `apps/web/app/(dashboard)/training/page.tsx:L22` filters by `tenantId`, so dashboard never shows QStash runs. Decide global vs tenant runs; for OKBET pilot insert OKBET tenant id or add global training UI.

### High

`apps/inference/main.py:L183`: inference returns response but never creates `QueryEvent`. Dashboard metrics, cache page, agents page, billing usage, live feed all read `QueryEvent`, so production dashboard stays empty. Insert tenant-scoped `QueryEvent` for cache hits and misses, including `queryHash`, `queryText`, `responseText`, `agentType`, `cacheHit`, `resolved`, `confidenceScore`, `resolutionMs`, `modelVersion`, `flaggedForReview`.

`apps/inference/auditor/judge.py:L66`: auditor can update `QueryEvent` only when `query_event_id` is passed, but `main.py:L176` never passes one. Create `QueryEvent` before `schedule_audit()` and pass id.

`pipeline/convert.py:L26`: training fetch reads all approved examples across all tenants. Add tenant scope for pilot or per-tenant pipeline; otherwise one tenant trains on another tenant's data.

`pipeline/run_pipeline.py:L31`: `convert.py` ignores `agent_type`; `pipeline/convert.py:L26` supports filter but `main()` never receives it. Pass agent type through CLI or remove misleading per-agent run arg.

`pipeline/convert.py:L65`: comment says temporal split newest 30%, but code shuffles before split at L63, so split is random. Sort by `createdAt` before splitting, then shuffle final train set.

`pipeline/run_pipeline.py:L59`: final update never sets `examplesUsed`, `evalDelta`, `adapterVersion`, `baseModelVersion`, or `promoted`; UI displays `examplesUsed`/`evalDelta` but they remain null.

`packages/extension/manifest.json:L23`: extension build fails because `icons/icon16.png`, `icon48.png`, `icon128.png` do not exist. Add icons under `packages/extension/icons/` or remove manifest icon block.

`packages/extension/src/background/service-worker.ts:L7`: popup start/stop only returns `{ ok: true }`; no message reaches content script, tenant id never injected, observer auto-starts on page load. Implement tab messaging and storage/session config for `SESSION_START`, `SESSION_END`, tenant id.

`packages/extension/src/content/observer.ts:L67`: tenant id defaults to `"unknown"`, producing unusable/cross-tenant training exports. Load tenant id from authenticated setup/storage before capture; block capture if missing.

`apps/web/app/(dashboard)/settings/billing/page.tsx:L37`: displayed prices (`$49`, `$199`) do not match configured Polar sandbox products in project docs (`$149`, `$499`). Align pricing UI with product config.

### Medium

`apps/web/components/dashboard/settings-tabs.tsx:L42`: authorized IP UI appends local state after any response and never loads existing IPs. Fetch persisted list on mount/SWR and only mutate after `res.ok`.

`apps/web/components/dashboard/settings-tabs.tsx:L243`: danger-zone UI reports `Scheduled` after stub response. Wire to real API result and show failure when server rejects.

`apps/web/components/dashboard/cache-controls.tsx:L19`: clear cache button reports success without checking `res.ok`. Check response and show error state.

`apps/web/components/dashboard/cache-controls.tsx:L75`: threshold initial value hardcoded from `apps/web/app/(dashboard)/cache/page.tsx:L204`; edits reset on reload and inference keeps using env `SEMANTIC_CACHE_THRESHOLD`. Persist threshold and read it in `apps/inference/cache/semantic.py`.

`apps/web/app/(dashboard)/knowledge/page.tsx:L56`: document count hardcoded `0` while upload dialog exists. Back with real document model/API or remove count until implemented.

`apps/web/app/(dashboard)/cache/page.tsx:L196`: docs show `DELETE /api/cache/{queryHash}`, but implemented endpoint is only `DELETE /api/cache/clear`. Add per-entry route or fix docs.

`apps/web/app/api/settings/api-key/route.ts:L8`: route uses `redirect('/login')` inside API handler. Return `401` JSON to avoid HTML/redirect response for API clients.

`apps/web/app/(dashboard)/settings/page.tsx:L11`: settings page no longer selects `createdAt`, so tenant tab lost "member since" info from previous UI. Add if still useful.

`apps/web/app/(dashboard)/training/page.tsx:L8`: `TRAINING` enum state exists but UI style map lacks it. Add style to avoid queued fallback during fine-tuning.

`apps/inference/cache/semantic.py:L81`: cache write swallows every exception. Log structured warning at least; otherwise dashboard says cache enabled while all writes may fail.

`apps/inference/auditor/judge.py:L137`: auditor swallows all exceptions. Add logging/metrics, especially for Anthropic/schema failures.

`apps/web/scripts/register-qstash-cron.ts:L8`: idempotency check only matches destination substring; if destination changes from ngrok to Railway, old schedule remains and new one is skipped. Match exact destination or update stale schedule.

### Low / Repo Hygiene

`apps/web/package.json:L7`: `next lint` no longer works in this setup; command fails with `Invalid project directory provided ... /lint`. Replace with supported ESLint command, likely `eslint .` with existing config.

`package.json:L4`: root has no `typecheck` or `lint` scripts, so `bun run typecheck` fails and `bun run lint` invokes unrelated system command. Add root scripts delegating to web and extension.

`packages/extension/src/background/service-worker.ts:L4`: `console.log` in extension install path. Fine for dev, remove or gate for production.

Generated/local files present in project folder: `.codex/`, `.serena/`, `.playwright-mcp/`, `.DS_Store`, `apps/web/tsconfig.tsbuildinfo`, Python `__pycache__`. `.gitignore` covers some but not all local tool dirs. Add `.codex/`, `.serena/`, `.playwright-mcp/`, `.DS_Store`, `*.tsbuildinfo` if these should stay local.

## New/Modified File Assessment

### New API Routes

Most new API routes are placeholder stubs. Biggest problem is not just TODOs; client UI treats them as successful production operations. This creates false confidence and weakens security because unauthenticated external requests can hit operational-looking endpoints.

Recommended rule: no dashboard API route should ship without:

- `auth()` guard
- tenant id from session only
- concrete persistence/effect
- JSON `401`/`403` responses, not `redirect()`
- failure surfaced to caller

### New Dashboard Components

`cache-controls.tsx`, `settings-tabs.tsx`, and `upload-dialog.tsx` are visually consistent with current dark dashboard, but they mostly optimistic-update against stub APIs. Wire to persisted server state before relying on them for OKBET pilot.

### Modified Dashboard Pages

`cache/page.tsx`, `knowledge/page.tsx`, `settings/page.tsx` integrate new controls cleanly, but now expose incomplete features. Prefer hiding incomplete controls behind disabled state/feature flag until endpoints work.

## Cross-System Gaps

### Dashboard vs Inference

Dashboard analytics depend on `QueryEvent`. Inference handles queries but never writes `QueryEvent`. Result: dashboard overview, agents, cache, billing usage, live feed, and review/audit linkage remain empty or misleading.

### Knowledge Base vs Vector Search

Manual chunk creation writes `KnowledgeChunk`, but no embedding is created. Upload returns fake processing. Agents never retrieve `KnowledgeChunk` or vector docs. Result: "Knowledge Base" currently does not affect answers.

### Cache Controls vs Semantic Cache

Web UI exposes clear/threshold controls. Inference reads threshold from env once and writes to Upstash Vector. Web clear endpoint does not call Vector. Result: cache controls do not control cache.

### Training Pipeline vs Tenant Model

Pipeline reads all approved examples globally while training UI filters by tenant. QStash run creates global `TrainingRun`. Result: tenant dashboard cannot see scheduled runs, and training data can cross tenant boundaries.

### Extension vs Training Pipeline

Extension exports encrypted/XML sessions, but no ingestion endpoint converts exports into `TrainingExample`. Result: Chrome extension does not feed training pipeline yet.

## Verification

Commands run:

```bash
cd /Users/rihan/all-coding-project/autocsr/apps/web && bun run typecheck
```

Result: passed.

```bash
cd /Users/rihan/all-coding-project/autocsr/apps/web && bun run lint
```

Result: failed. `next lint` treats `lint` as project dir: `Invalid project directory provided, no such directory: /Users/rihan/all-coding-project/autocsr/apps/web/lint`.

```bash
cd /Users/rihan/all-coding-project/autocsr/packages/extension && bun run build
```

Result: failed. CRX plugin cannot find `icons/icon16.png`.

```bash
cd /Users/rihan/all-coding-project/autocsr && bun run typecheck
```

Result: failed. Root script missing.

```bash
cd /Users/rihan/all-coding-project/autocsr && bun run lint
```

Result: failed. Root script missing; shell resolved unrelated `lint` executable.

## Priority Fix Plan

1. Lock down all new API routes with `auth()` and tenant scoping.
2. Remove fake-success behavior or hide incomplete UI controls.
3. Add `QueryEvent` write path in inference and pass created id to auditor.
4. Fix QStash pipeline subprocess path and decide tenant/global training model.
5. Tenant-scope `TrainingExample` conversion.
6. Wire knowledge upload to storage/chunk/embed or disable upload.
7. Fix extension icons and popup/content lifecycle.
8. Replace broken lint scripts and add root verification scripts.
9. Add gitignore entries for local tool/generated artifacts.

