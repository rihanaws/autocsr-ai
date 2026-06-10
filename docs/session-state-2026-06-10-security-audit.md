# Session State — 2026-06-10 — AI/Inference Security Audit

> Handoff artifact. Purpose: continue remediation of exploitation/injection/bypass
> findings in the AutoCSR inference + extension + web layers. Cross-audited against
> repomix export `repomix-output-rihanaws-autocsr-ai_git.md`.

## Context snapshot
- Repo: https://github.com/rihanaws/autocsr-ai.git
- Reviewer lens: "can a motivated attacker bypass the AI guards, inject, or exploit the model path?"
- Scope reviewed: `apps/inference/**`, `apps/web/app/api/**`, `apps/web/lib/auth.ts`,
  `apps/web/prisma/schema.prisma`, `packages/extension/**`, Polar webhook, CI/CD, committed env files.
- Verdict: **Request Changes.** Not safe for a live OKBET session until Critical + High items close.

---

## CRITICAL (do before any live OKBET data flows)

### C1 — Live secrets committed
- `_env.local` contains real values: Neon DB password (`npg_kPcva1...`), `AUTH_SECRET`,
  Google OAuth secret, `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `RESEND_API_KEY`,
  all Upstash REST tokens (Redis/Vector/QStash), `INFERENCE_API_SECRET`.
- `client_secret_*.json` (Google OAuth web client_secret) is present and **not gitignored**.
- `.gitignore` ignores `.env.local` but the file is `_env.local` (underscore) → **rule does not match**.
- ACTIONS:
  1. `git rm --cached _env.local client_secret_*.json`; add `_env.local` and `client_secret_*.json` to `.gitignore`.
  2. Rotate EVERY credential above (assume compromised). Neon password, AUTH_SECRET, Google OAuth secret,
     Polar token+webhook secret, Resend key, all Upstash tokens, INFERENCE_API_SECRET.
  3. Scrub git history (`git filter-repo` or BFG) — rotation alone doesn't remove them from history.

### C2 — Inference layer has no per-tenant authorization
- `apps/inference/main.py`: only gate is shared `INFERENCE_API_SECRET`; `tenant_id` is trusted from the
  request body. Anyone with that one secret can act as ANY tenant (read/write/poison their cache).
- The documented per-tenant IP allowlist **never reaches this layer** — there is no IP check in `main.py`.
- ACTIONS: issue per-tenant inference credentials (or sign the web→inference call with tenantId bound to
  the secret), and/or enforce the IP allowlist server-side here. Verify `tenant_id` belongs to the caller.

### C3 — No prompt-injection defense in agents
- `graph/agents/{deposit,withdrawal,verification,onboarding,general}.py` concatenate raw `query` into the
  OpenAI `user` turn. System-prompt "never fabricate" is guidance, not a control. Classic
  "ignore previous instructions" coercion works → fabricated payout/policy/off-topic output.
- ACTIONS: add an injection classifier/guard before dispatch; wrap user content in clear delimiters;
  consider a dedicated injection-detection pass; keep agent output constrained.

### C4 — Scope filter is a no-op (`graph/guards/input_guard.py`)
- `_is_csr_relevant` uses substring `kw in lowered` with keywords like `"id"`, `"help"`, `"account"`,
  `"game"`. `"id"` matches *consider/video/idea/paid*. Almost all text passes → no jailbreak resistance.
- ACTIONS: token-based matching with word boundaries; raise the bar; don't rely on this as the only scope gate.

### C5 — Intra-tenant cache poisoning (`cache/semantic.py` + `main.py`)
- Cross-tenant isolation is GOOD (regex-validated tenant_id blocks Upstash filter injection + metadata
  re-check on read). But within a tenant, any successful injection (C3) is `write()`-cached at 0.92 sim
  and replayed to similar future queries with `cache_hit=true`, **bypassing agents + guards on replay**.
- ACTIONS: never cache responses that were `flagged`, low-confidence, or failed the output guard;
  add cache write gating; consider TTL + manual invalidation (the `DELETE /api/cache/{queryHash}` endpoint
  referenced in the cache page is not implemented yet).

---

## HIGH

### H1 — No rate limiting / no quota enforcement
- `app/api/chat/route.ts` and `main.py` have none. Tier limits (500/10K/50K) are display-only
  (`usage-meter` is cosmetic). FREE tenant → unlimited calls. Cost-amplification + cache-flood DoS.
- ACTIONS: Upstash Redis sliding-window limiter at `/api/chat`; enforce tier quota (count QueryEvents in
  period) before calling inference; 429 on breach.

### H2 — Auditor blocks event loop / may never run (`auditor/judge.py`)
- `audit_response` is `async` but calls the SYNCHRONOUS Anthropic SDK and opens a fresh `asyncpg` pool per
  audit. `schedule_audit` uses `get_event_loop()`/`run_until_complete` → misbehaves under uvicorn.
- Risk: the 5% safety sampler silently doesn't run in prod, or stalls requests when it does.
- ACTIONS: use `anthropic.AsyncAnthropic` + `await`; reuse a single app-lifetime asyncpg pool (FastAPI
  lifespan); schedule via `asyncio.create_task` from within the async handler, not a bespoke scheduler.

### H3 — Output guard is brittle regex (`graph/guards/output_guard.py`)
- Only catches specific English phrasings; reword/translate/reformat evades. Account-ID PII pattern
  `\b\d{10,16}\b` misses separated/9-or-17-digit IDs; phone pattern over-matches.
- ACTIONS: treat as defense-in-depth only; add model-based PII/hallucination check; broaden patterns;
  do not rely on this as a boundary.

### H4 — Extension "encryption" is non-protective (`extension/src/crypto/vault.ts`)
- Key generated `extractable: true`, stored as raw bytes in `chrome.storage.session` beside ciphertext in
  `storage.local`. Any extension-context code reads both. Checkbox, not a threat model.
- ACTIONS: if DAA implies at-rest protection of OKBET chats, redesign (non-extractable key, key never
  co-located with ciphertext, or encrypt server-side with a key the extension never holds).

### H5 — Extension Start/Stop is fake; tenantId="unknown" (`observer.ts`, `service-worker.ts`)
- Observer auto-starts on page load. Popup Start/Stop + worker `SESSION_START/END` just ack and do nothing
  → no real disconnect (matches known gap). `getTenantId()` reads `window.__AUTOCSR_TENANT_ID__` which the
  worker never sets → every session is `tenantId:"unknown"`; a hostile page can spoof it.
- ACTIONS: worker must actually start/stop the observer and inject a verified tenantId (not a window global);
  implement real disconnect; bind tenantId to authenticated extension state.

---

## MEDIUM
- M1 `extension/anonymizer.ts`: naive name regex over-redacts + misses most PII. Don't rely on 4 regexes.
- M2 `webhooks/polar/route.ts`: `PRODUCT_TIER_MAP` keys use `?? ""` → empty-string key collision can map an
  unknown productId to a real tier. Filter falsy keys when building the map.
- M3 `lib/auth.ts`: tenant slug from email local-part; only a 6-char id suffix prevents collision. Add retry.
- M4 `main.py` `/api/training/weekly-trigger`: unauthenticated stub (QStash signature TODO). Don't ship reachable.

---

## WHAT'S ALREADY GOOD (don't regress)
- Cross-tenant cache isolation: regex-validated tenant_id (blocks Upstash filter injection) + on-read
  metadata re-check. Keep this pattern.
- Auditor SQL is parameterized; Prisma ops tenant-scoped (`updateMany/deleteMany where {tenantId}`).
- Web auth sources `tenantId` from session, never the client.
- Polar webhook verifies signatures; router has a confidence floor (<0.7 → GENERAL).

---

## SUGGESTED FIX SEQUENCE (severity-ordered, self-contained blocks)
1. **Block A — Secret hygiene** (C1): rm cached, gitignore, rotate all, scrub history. Blocks everything else.
2. **Block B — Inference auth** (C2): per-tenant auth/IP enforcement in `main.py`.
3. **Block C — Injection + scope** (C3, C4): injection guard + real scope tokenizer before dispatch.
4. **Block D — Cache write gating** (C5): never cache flagged/low-confidence/guard-failed responses.
5. **Block E — Rate limit + quota** (H1): Redis limiter at `/api/chat` + tier quota enforcement.
6. **Block F — Auditor reliability** (H2): AsyncAnthropic + lifespan pool + create_task.
7. **Block G — Extension integrity** (H4, H5): real start/stop, verified tenantId, redesign at-rest model.
8. **Block H — Guard hardening + medium items** (H3, M1–M4).

## OPEN QUESTIONS TO RESOLVE NEXT SESSION
- Does the OKBET DAA impose specific at-rest / PII obligations that H4/M1 must satisfy? (check the FINAL agreement)
- Is the repomix export current re: the three documented inference bugs (XFF off-by-one, UUID-vs-slug tenant
  match, hardcoded OKBET IP typo)? The exported `main.py` shows NO IP-allowlist code at all — confirm whether
  that logic was reverted, lives elsewhere, or was never wired. This gates C2/H-IP work.
- Confirm whether `_env.local` / `client_secret_*.json` are actually tracked in git (vs. just present locally)
  to scope the history-scrub.

## NOTE ON METHOD
- Cross-audit this file against an independent codebase review (Codex) before acting, per established practice —
  the "feature marked done but is a stub" pattern recurred here (disconnect, IP allowlist, cache invalidation,
  quota enforcement all surfaced as non-functional or display-only).
