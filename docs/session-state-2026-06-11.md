# Session State — 2026-06-11

> **Handoff note:** This file is the canonical resume point for the next chat thread.
> Paste CLAUDE.md contents + this file as context-priming at the start of the next session.
> Do NOT re-read prior session-state-* files — this supersedes them all.

---

## 1. Primary Request and Intent

**Session goal:** Complete the security remediation backlog (blocks C3/C4/C5/C2) that was
planned as of session-state-2026-06-11, then triage and fix Dependabot vulnerabilities before
proceeding to Block E (rate limiting + quota enforcement).

**Underlying intent:** Harden AutoCSR's production deployment on Vercel + Railway ahead of
the live OKBET pilot. OKBET COO Wayne Thong is the first authorized user. Production is LIVE
but OKBET hasn't signed up yet — `setup:okbet` runs post-signup.

**Shift during session:** The Block B/C2 scope expanded when a pre-flight grep found 4 live
usages of `Tenant.apiKey` in the web app (settings page, rotate action, API route, UI tab).
The architecture review also concluded the original proposal (add fields to Tenant) was
wrong — a dedicated `ApiKey` model was the correct design. Both issues were resolved.

---

## 2. Key Concepts Established

**SHA-256 vs bcrypt for API keys:**  
bcrypt is correct for passwords (user-chosen, guessable, short). SHA-256 is correct for
machine-generated high-entropy random keys (22+ base64url chars = 132 bits entropy). Zero
brute-force risk justifies O(1) hash lookup vs bcrypt's ~300ms deliberate slowness. This is
what Stripe, GitHub, and Supabase use. No new dependencies required.

**Dual-path inference auth:**  
- Path 1 (global): `Authorization: Bearer <INFERENCE_API_SECRET>` — for internal
  web→inference and QStash calls. Compared with `secrets.compare_digest`.
- Path 2 (per-tenant): `Authorization: Bearer ak_live_*` or `ak_test_*` — for operator
  direct API access. SHA-256 hash lookup in `ApiKey` table. tenantId in request body must
  match key's tenantId (403 if mismatch). `lastUsedAt` updated via `asyncio.create_task`.

**ApiKey model design (Option B):**  
Dedicated table, many keys per tenant. Rejected: Option A (single key on Tenant — no
zero-downtime rotation). Rejected: Option C (Project/Workspace hierarchy — premature for
pilot). Key fields: `keyHash` (SHA-256, @unique, primary lookup), `prefix` (14 chars,
display-only), `environment` (PRODUCTION/DEVELOPMENT enum), `revokedAt`, `expiresAt`,
`lastUsedAt`.

**Key format:**  
`ak_live_<22 base64url chars>` (production) / `ak_test_<22 base64url chars>` (development).
Full raw key shown once at provisioning (setup:okbet banner), never stored, never recoverable.
Prefix is `raw.slice(0, 14)`.

**Settings UI scope for pilot:**  
Self-service key rotation requires "show raw key once" UX (modal + copy button + warning).
That's a post-pilot feature. For pilot: settings page shows prefix + env + issued date.
Rotate button removed, replaced with "contact support to rotate" note.

**Document authority hierarchy (from CLAUDE.md):**  
STATUS.md > DESIGN_SYSTEM.md > CLAUDE.md > docs/decisions/ > session-state-*.
STATUS.md is the ONLY source of completion truth. Update it FIRST before declaring anything done.

---

## 3. Research Findings

**Architecture review: OpenAI/Anthropic/Stripe/GitHub PAT patterns:**  
All use a dedicated credential table (not inline on the account/org model). All use fast
hashing (SHA-256 or equivalent) for high-entropy secrets. All support multiple active keys
per account for zero-downtime rotation. None expose raw keys after creation. AutoCSR's
Option B design aligns with this pattern at appropriate pilot scope.

**Dependabot vulnerability triage (all 23 are Python/pip — zero npm/JS vulns):**
- `nltk`: Critical Zip Slip (patched 3.9.4), 3 high (2 unpatched — downloader-only),
  2 medium (1 unpatched). Attack vectors require calling `nltk.download()` or
  `nltk.app.wordnet_app` — neither is called in the production inference API.
- `transformers`: 3 high deserialization (patched 4.48.0), 9 medium ReDoS (patched 4.53.0),
  1 low. Production inference uses Together.ai API (no local model loading). Pipeline
  (training) uses transformers locally but is not exposed to external HTTP input.
- `python-dotenv`: 1 medium symlink attack via `set_key()` — patched 1.2.2. AutoCSR only
  calls `load_dotenv()` (read-only). Not exploitable as used.
- **Conclusion:** Low real-world exploitability. Not a Block E blocker. Fix with version pins.

---

## 4. Active Artifacts — Current State

### apps/inference/main.py
**Commits:** f4603a7 (C3/C4), cc905fc (C5), ee0a035 (C2)
**Current state:** Production-hardened. Contains:
- C3: `_INJECTION_RE` blocklist, runs before cache/agent dispatch → 400 INJECTION_DETECTED
- C4: `MAX_QUERY_BYTES = 2000` → 400 QUERY_TOO_LONG
- C5 (in cache/semantic.py): cache write-gating (error responses, PII, confidence floor)
- C2: `_verify_tenant_api_key()` (SHA-256 lookup), `_update_key_last_used()` (background),
  dual-path auth in `/api/infer` — Path 1 global secret, Path 2 per-tenant key
- `secrets` and `asyncio` imports added
**Remaining:** None for security blocks. Block E (rate limiting) will add quota checks here.

### apps/inference/cache/semantic.py
**Commit:** cc905fc
**Current state:** `cache_write()` guards: skip empty/short responses, skip error phrases
(`_ERROR_INDICATORS`), skip below confidence floor (`CACHE_MIN_CONFIDENCE` env, default 0.7),
skip PII patterns (`_PII_RE`). Returns bool. Callers log skips at DEBUG.
**Remaining:** None.

### apps/web/prisma/schema.prisma
**Commit:** ee0a035
**Current state:** `Tenant.apiKey` (plaintext) DROPPED with `--accept-data-loss`.
`ApiKey` model and `ApiKeyEnv` enum ADDED. `Tenant.apiKeys ApiKey[]` relation added.
DB pushed, Prisma client regenerated.
**Remaining:** Block E will not require schema changes unless usage counters are needed
(QueryEvent table already captures usage — no new columns expected).

### apps/web/lib/api-key.ts (NEW)
**Commit:** ee0a035
**Current state:** `generateApiKey(env)`, `hashApiKey(raw)`, `isApiKey(token)`. No deps.
**Remaining:** None.

### apps/web/scripts/setup-okbet-tenant.ts
**Commit:** ee0a035
**Current state:** Revokes prior active keys → generates new `ak_live_` key → creates
`ApiKey` row → prints raw key once between ═══ banners with secure delivery instructions.
**Remaining:** Run this AFTER Wayne Thong signs up at /signup. Not run yet (no prod tenant).

### apps/web/app/(dashboard)/settings/page.tsx
**Commit:** ee0a035
**Current state:** Queries active `ApiKey` row instead of `tenant.apiKey`. Passes
`{ prefix, environment, createdAt }` to SettingsTabs. No raw key passed anywhere.
**Remaining:** None.

### apps/web/app/api/settings/api-key/route.ts
**Commit:** ee0a035
**Current state:** Returns `{ prefix }` from active `ApiKey` row, or `{ prefix: null }`.
**Remaining:** None.

### apps/web/components/dashboard/settings-tabs.tsx (ApiAccessTab)
**Commit:** ee0a035
**Current state:** Shows masked prefix + environment label + issued date. Rotate button
removed. "Contact support to rotate" static note. No rotate action wired.
**Remaining:** None for pilot. Post-pilot: add self-service key rotation with "show once" UX.

### apps/web/app/(dashboard)/settings/actions.ts
**Commit:** ee0a035
**Current state:** `rotateApiKey()` server action DELETED entirely.
**Remaining:** None.

### apps/web/components/dashboard/settings-client.tsx
**Commit:** ee0a035
**Current state:** Entire file DELETED (was dead code — `ApiKeySection` export unused).
**Remaining:** None.

### apps/inference/requirements.txt
**Current state:** UNPINNED for nltk, transformers, python-dotenv. Dependabot alerts open.
**Remaining:** THIS IS THE NEXT ACTION (before Block E). See §10 Pending Tasks.

### STATUS.md
**Commits:** f4603a7, cc905fc, ee0a035
**Current state:**
- C3 → CLOSED (injection guard)
- C4 → PARTIAL (length cap done; existing input_guard.py is primary scope filter, untouched)
- C5 → CLOSED (cache write-gating)
- C2 → CLOSED (per-tenant ApiKey model, dual-path auth)
- Dependabot: 23 open (to be updated after requirements.txt fix)
**Remaining:** Update after Dependabot pin commit. Update after each Block E/F/G/H item closes.

### CLAUDE.md
**Commits:** a7de71d (C5 docs), 1915994 (C2 docs)
**Current state:** Inference Security section documents C5 cache write-gating and C2 dual-path
auth. Known Gaps still says "24 Dependabot vulnerabilities (medium priority)" — needs update
to reflect triage results after the pin commit.
**Remaining:** Update Known Gaps after Dependabot pin commit.

---

## 5. Decisions Made and Rationale

| Decision | Rationale | Forecloses |
|---|---|---|
| Option B (dedicated ApiKey model) | Enables zero-downtime key rotation; matches Stripe/OpenAI/Anthropic patterns; marginal extra work vs Option A | Option A (single field on Tenant). Option C (Project hierarchy) deferred to post-pilot. |
| SHA-256 not bcrypt for API key hashing | bcrypt's slowness is for passwords; 132-bit random keys are immune to brute force; SHA-256 is O(1), no new deps | Any bcrypt-based implementation |
| Settings UI: prefix-only, no rotate button | "Show once" rotate UX is a full feature; pilot has one tenant; CLI rotation via setup:okbet is sufficient | Self-service rotation in dashboard — build post-pilot when 2nd operator arrives |
| settings-client.tsx deleted | Dead export, zero usages found in codebase | — |
| `Tenant.apiKey` dropped with `--accept-data-loss` | Plaintext storage is a security liability; 2 non-null rows were dev accounts; field was never wired to inference auth | Re-adding a plaintext key field |
| NLTK/Transformers Dependabot: not a Block E blocker | Attack vectors (downloader, wordnet_app, local model loading) unreachable via production API endpoints | — |
| Dismiss 4 unpatchable Dependabot alerts | No stable patch exists; attack vectors verified unreachable | — |
| C4 marked PARTIAL (not CLOSED) | existing `input_guard.py` is primary scope filter; length cap is secondary; the audit item asked for scope filter, which `input_guard.py` already handles | — |

---

## 6. Problem Solving and Reasoning Trail

**Problem: Pre-flight grep found 4 live usages of Tenant.apiKey in web app**
- Expected: zero usages (field appeared vestigial from schema scaffolding)
- Found: settings/page.tsx, api/settings/api-key/route.ts, settings-tabs.tsx ApiAccessTab,
  settings/actions.ts rotateApiKey()
- Claude Code surfaced this proactively from the pre-flight check in the Block B prompt
- Resolution: Scope expanded to migrate all 4 call sites. Option 2 chosen (prefix-only, no
  rotate button) to avoid building "show raw key once" UX under security sprint pressure
- Lesson: pre-flight grep must be the first action in any schema field removal

**Problem: Original Block B prompt used bcrypt (wrong for API keys)**
- Caught during architecture review, before implementation
- Corrected to SHA-256 in the final prompt
- bcrypt was already referenced in the earlier Block B prompt given in the prior session —
  that prompt was explicitly not used; the corrected prompt was generated fresh

**Problem: Architecture review revealed Option A (Tenant.apiKey fields) was wrong**
- The original C2 proposal added `inferenceApiKeyHash` + `inferenceApiKeyPrefix` to Tenant
- This would have created two confusing co-located key fields, no rotation support
- Review concluded Option B (dedicated table) is the correct design
- ~2h extra implementation vs Option A; paid back with zero-downtime rotation for product lifetime

**Dead end avoided: Project/Workspace hierarchy (Option C)**
- Considered during architecture review
- Rejected: no tenant-level project isolation needed yet; no multi-region deployments;
  environment separation handled by `environment` enum field on ApiKey directly
- Revisit when 2nd enterprise customer drives the requirement

---

## 7. Voice Calibration Corrections

None required this session. Responses were technical, direct, production-grade throughout.
No tone adjustments requested.

---

## 8. All User Messages (intent log)

1. "Resume from 'session-state-2026-06-11'"
2. "yes we have added the API keys and done the 2 task see the summery and then guide us for next" [attached Block C/D summary showing C3/C4/C5 complete]
3. "Architecture Review Request — OpenAI/Anthropic Style API Key System [full review brief]"
4. "go proceed" [approved the architecture review recommendation, requested Block B prompt]
5. "check and confirm" [attached Block B execution summary from Claude Code]
6. "see this and guide me what should i do" [pasted Claude Code's 4-call-site discovery + option menu]
7. "check and confirm" [attached full Block B completion summary]
8. [Attached Dependabot gh CLI output — 23 Python pip vulnerabilities]
9. "see and guide me" [requesting Dependabot analysis and action plan]
10. "/compact-handoff-mode as i want to start a new chat thread with all the task we have done so far. In the new chat we will start from here so incorporate all necessary things"

---

## 9. Open Questions and Unresolved Ambiguities

**Post-deploy TODOs #3–#5 — status unconfirmed:**
The user confirmed #1 (Railway API keys) and #2 (Google redirect URI) were done.
The following were specified but never confirmed complete:
- TODO #3: Polar webhook endpoint URL → `https://autocsr.vercel.app/api/webhooks/polar`
  (currently may still point to ngrok or old URL)
- TODO #4: QStash cron destination → Railway inference URL
  (`bun run cron:register` with `TRIGGER_URL=https://inference-production-e5c4.up.railway.app/api/training/weekly-trigger`)
- TODO #5: VERCEL_TOKEN rotation (was pasted in chat session, now exposed)
Confirm these manually before the OKBET pilot goes live.

**OKBET production tenant not yet created:**
Wayne Thong has not signed up yet. `bun run setup:okbet` (which now provisions the
ApiKey and prints it once) has not been run against production. When he signs up:
1. Verify tenant row created: check Neon DB
2. Run `setup:okbet` immediately → copy printed ak_live_ key
3. Deliver key to Wayne Thong via secure channel (Signal/encrypted email)
4. Verify with a test inference call using that key

**transformers in apps/inference vs pipeline only:**
It's unclear whether `transformers` is actually imported at runtime by `apps/inference/main.py`
(which uses Together.ai API for inference) or only by `pipeline/`. The Dependabot fix pins
the version in requirements.txt regardless, but understanding the actual import graph matters
for assessing whether the HIGH deserialization vulns are a real risk. Check with:
`grep -r "from transformers\|import transformers" apps/inference/ --include="*.py"`

---

## 10. Pending Tasks

In execution order:

### IMMEDIATE — Dependabot fix (before Block E)
Run the Claude Code prompt from the previous message in this thread. Exact actions:
1. Check current pins: `grep -E "^(nltk|transformers|python-dotenv)" apps/inference/requirements.txt`
2. Update: `nltk>=3.9.4`, `transformers>=4.53.0`, `python-dotenv>=1.2.2`
3. `pip install -r requirements.txt` — verify no conflicts
4. Smoke test: uvicorn starts, `/health` returns 200
5. Dismiss 4 unpatchable alerts via `gh api --method PATCH` with `dismissed_reason=tolerable_risk`
6. Update STATUS.md + CLAUDE.md Known Gaps
7. Commit: `chore(deps): pin nltk>=3.9.4, transformers>=4.53.0, python-dotenv>=1.2.2`

### Block E — Rate Limiting + Tier Quota Enforcement (H1)
**What it is:** Enforce Starter (10K queries/month), Growth (50K), Enterprise (custom) limits.
Return HTTP 429 when tenant exceeds tier quota. QueryEvent table already captures usage data.
**Why it's critical:** Without this, any tenant can burn unlimited inference calls beyond
their billing tier. This is a billing integrity failure.
**Implementation sketch:**
- Web layer (`app/api/chat/route.ts`): before calling inference, count QueryEvent rows for
  current month filtered by tenantId; compare against tier limit; return 429 if exceeded.
  OR: inference layer (main.py `get_tenant_config` already queries Tenant — add usage count there).
- Tier limits: FREE=500, STARTER=10000, GROWTH=50000, ENTERPRISE=null (unlimited)
- Redis cache the count (Upstash Redis, TTL=60s) to avoid a DB count on every request
- 429 response body: `{ "error": "Monthly query limit reached", "code": "QUOTA_EXCEEDED", "tier": "STARTER", "limit": 10000 }`

### Block F — Auditor Async Verification (H2)
**What it is:** Audit finding that `schedule_audit()` (Claude Haiku judge) may be synchronous
in some code paths. CLAUDE.md claims this is fixed. Verify before writing any fix.
**Action:** Read `apps/inference/auditor/judge.py` and `schedule_audit()` call sites in
main.py. If async, close as verified. If sync, fix.
**Do not write code until you've read the current implementation.**

### Block G — Extension Message Origin Check (H4/H5)
**What it is:** Chrome extension content script doesn't validate message origin.
`chrome.runtime.onMessage` listener should verify `sender.origin` or `sender.id`.
**Location:** `packages/extension/src/background/service-worker.ts`

### Block H — Medium Findings (M1–M3)
Details TBD — read security audit findings from STATUS.md when this block is reached.

### Post-Deploy TODOs (manual, no code) — confirm or execute
- TODO #3: Update Polar webhook to `https://autocsr.vercel.app/api/webhooks/polar`
- TODO #4: `bun run cron:register` with Railway TRIGGER_URL
- TODO #5: Rotate exposed VERCEL_TOKEN in Vercel dashboard + GitHub secrets

---

## 11. Current Work

**What was being worked on:** Dependabot vulnerability triage and remediation planning.

**Last concrete action:** Provided a complete Claude Code prompt for the Dependabot fix,
covering: version pin updates to requirements.txt (nltk≥3.9.4, transformers≥4.53.0,
python-dotenv≥1.2.2), install verification, smoke test, GitHub alert dismissal for 4
unpatchable findings, STATUS.md + CLAUDE.md updates, and the exact commit message.

**That prompt has NOT been executed yet.** It was provided at the end of the last message
in this thread. The next action is to run it in Claude Code.

---

## 12. Optional Next Step

Execute the Dependabot fix prompt immediately (it was the last thing delivered in this
thread). Then proceed to Block E. Exact quote establishing this sequence:

> "Block E is next after the Dependabot check."

**Block E prompt should specify:**
- Query `QueryEvent` count for current billing month filtered by `tenantId`
- Compare against tier limit from Tenant.tier
- Cache result in Upstash Redis with 60s TTL (key: `quota:{tenantId}:{YYYY-MM}`)
- Return 429 with structured body if exceeded
- Check location: web app chat route (`apps/web/app/api/chat/route.ts`) is preferred
  over inference layer — keeps inference stateless and the web app as the quota gatekeeper
- Update STATUS.md H1 → CLOSED after validation

---

## Commit Log (this session)

| Hash | Message |
|---|---|
| f4603a7 | security(inference): add injection guard and scope filter (C3/C4) |
| cc905fc | security(cache): add cache write-gating, PII + error response guards (C5) |
| a7de71d | docs(claude): document C5 cache write-gating in Inference Security section |
| ee0a035 | security(auth): per-tenant inference API keys, dedicated ApiKey model (C2) |
| 1915994 | docs(claude): document C2 in Inference Security section |
| PENDING | chore(deps): pin nltk>=3.9.4, transformers>=4.53.0, python-dotenv>=1.2.2 |

---

## Stack Reference (for new chat context)

- Runtime: **Bun** exclusively (never npm/yarn/pnpm)
- Frontend: Next.js 16 App Router, NO src/ folder, TypeScript strict, Tailwind v4, Shadcn/ui
- DB: Neon PostgreSQL + Prisma 6. CRITICAL: use `DATABASE_URL="<url>" bunx prisma db push` (dotenv-cli broken)
- Inference: FastAPI Python 3.11 + LangGraph, deployed Railway
- Start inference: `cd apps/inference && set -a && source .env && set +a && /Users/rihan/.pyenv/versions/3.11.9/bin/python -m uvicorn main:app --reload --port 8000`
- Auth: NextAuth v5. ALL API routes: `const session = await auth(); if (!session?.user?.tenantId) return 401`
- Billing: Polar sandbox. `customer.externalId` = tenantId (NOT customerId)
- Domain: `autocsr.techsci.co` / Vercel. Inference: Railway `inference-production-e5c4.up.railway.app`
- Pilot client: OKBET (Gavin Ventures, Inc.), COO Wayne Thong. Tenant slug: `okbet`
- OKBET authorized IPs: `153.53.253.81`, `89.117.176.115`, `103.170.173.26`
- Design: DESIGN_SYSTEM.md is authority. Fonts: Geist (display), Inter (body), JetBrains Mono (ALL data values)

