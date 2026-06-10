---
name: autocsr-domain
description: AutoCSR domain knowledge — multi-tenant AI customer-support automation for online betting (OKBET pilot). Use when working on tenancy, the inference pipeline, Chrome extension, knowledge base/RAG, billing webhooks, review queue, or training pipeline in the autocsr repo. Trigger words: tenant, inference, LangGraph, cache hit, knowledge chunk, review item, Polar webhook, QStash, extension, OKBET.
---

# AutoCSR Domain Knowledge

Monorepo: `apps/web` (Next.js 15, dashboard + API), `apps/inference` (FastAPI + LangGraph, Hermes-3-Llama-3.1-8B + LoRA), `packages/extension` (Chrome extension for agent-assist). Always bun. Repo AGENTS.md holds build commands and design tokens — this skill holds domain logic.

## Multi-tenancy (highest-priority invariant)

- Every domain table carries `tenantId`. Every query MUST filter by `tenantId` taken from the server session — never from request body, query params, or client payloads.
- Polar billing maps `customer.externalId` = `tenantId`. Webhook handler (`app/api/webhooks/polar/route.ts`) matches on external id first; `customerId` is NOT the tenant key.
- Tenant provisioning: `scripts/setup-okbet-tenant.ts` is the reference flow (Tenant row → admin User → plan assignment).

## Inference pipeline (request lifecycle)

1. Customer message arrives (extension or API) with tenant context.
2. Cache check — Upstash Redis exact/semantic (Vector) lookup; cache hit = no model call. `cache_entries` lives in the Neon **pooler** endpoint DB.
3. Miss → LangGraph graph in `apps/inference`: retrieve KnowledgeChunks (Upstash Vector embeddings) → Hermes-3 + tenant LoRA adapter → response with confidence score.
4. Low-confidence responses become `ReviewItem` rows → human review queue in dashboard → approved answers feed `TrainingExample` → periodic `TrainingRun` (LoRA fine-tune) via QStash cron.
5. Every request logged as `QueryEvent` — usage metering for Polar billing tiers.

## Knowledge base / RAG

- `KnowledgeChunk` = chunked tenant docs. On chunk create, embedding upsert to Upstash Vector is required (Week-5 gap: verify it exists before assuming).
- Embeddings are namespaced per tenant in Vector — cross-tenant retrieval is a data breach, treat as P0.

## Chrome extension (packages/extension)

- Injects into betting-site CSR consoles (Chatwoot-style inboxes). DOM targeting: ARIA roles + `data-*` attributes ONLY — site CSS classes are minified/unstable.
- Talks to web app API with tenant-scoped token. Never embed secrets in extension bundle.

## Betting-domain constraints

- OKBET pilot (Gavin Ventures, Philippines market): responses must never give betting advice, odds predictions, or bonus promises not in the knowledge base. Escalate KYC, payout disputes, and responsible-gambling queries to human review — do not auto-respond.
- PII in transcripts (names, account numbers, payment refs) must not enter training data — strip before `TrainingExample` creation.

## Operational gotchas

- Two Neon endpoints, same project: pooler (`...-pooler`) = inference tables; non-pooler = auth/app tables (Tenant, User, Session). psql against the wrong endpoint shows "missing" tables — check endpoint before debugging.
- dotenv-cli broken on this machine: for db push use `DATABASE_URL="<neon-pooler-url>" bunx prisma db push`; one-off scripts: `bun --env-file=.env.local run <script>`.
- QStash cron registered via `bun run cron:register`; local webhook testing through ngrok static URL (see repo AGENTS.md).
- Email failures must never block the triggering flow (pattern set in `lib/auth.ts` createUser → welcome email try/catch).

## Definition of done (domain-specific)

Tenancy filter verified on every new query; no PII path into training data; extension selectors ARIA/data-only; `bun run typecheck && bun run lint && bun run build` green.
