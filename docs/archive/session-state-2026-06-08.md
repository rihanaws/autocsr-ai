# AutoCSR — Session State Handoff
**Date:** June 8, 2026 | **Owner:** Sayem Abdullah Rihan / TechSci, Inc.
**Project:** AutoCSR AI — `/Users/rihan/all-coding-project/autocsr`

---

## HOW TO RESUME

Start Claude Code in autocsr project root and paste:

```
Read CLAUDE.md.
Read session-state-2026-06-08.md from project root (copy it there first).
Status: Weeks 1–4 + security/pipeline fix pass complete.
Remaining: Extension fixes (Block 4), UI fixes (Block 5), Repo hygiene (Block 6), Run F (production deploy prep).
Start with Block 4 — extension icons, service-worker, observer, popup.
```

---

## 1. Primary Request and Intent

Build AutoCSR — an AI-native CSR automation SaaS targeting online betting operators in Southeast Asia. First client: OKBET (Gavin Ventures, Inc.). The session goal was to complete all remaining development tasks through a structured series of Claude Code prompt runs, then fix all issues found by a Codex 5.5 codebase review.

---

## 2. Complete Build Status

| Area | Status | Notes |
|------|--------|-------|
| Monorepo scaffold | ✅ | Weeks 1–2 |
| All 5 LangGraph agents | ✅ | deposit/withdrawal/verification/onboarding/general |
| Input/Output guards | ✅ | PII, scope, hallucination |
| Semantic cache | ✅ | Upstash Vector 0.92 threshold (now DB-persisted per tenant) |
| Claude Haiku auditor | ✅ | 5% async — now receives query_event_id |
| Chrome Extension | ✅ code / ❌ build | Icons missing → build fails; service-worker/observer broken |
| Polar webhook | ✅ | Tier sync wired |
| Auth (Google + magic link) | ✅ | 3 bugs fixed, Tenant auto-provision |
| Login / Signup pages | ✅ | Dark design |
| dotenv-cli DB scripts | ✅ | Never hits wrong DB |
| .claude/ config | ✅ | rules/, skills/, hooks/, settings.json |
| CLAUDE.md | ✅ | ~50 lines |
| Design tokens | ✅ | All dashboard pages |
| Profile dropdown + logout | ✅ | |
| Usage meter | ✅ | Count/limit + color bar |
| Profile & Security / TOTP 2FA | ✅ | otplib |
| Billing page | ✅ | Polar checkout — prices WRONG ($49/$199 not $149/$499) ← fix pending |
| Landing page (9 sections) | ✅ | All sections including trust/social-proof/FAQ |
| Welcome email | ✅ | React Email + Resend + auth createUser event |
| Training pipeline | ✅ | config/convert/finetune/evaluate/promote/run_pipeline |
| QStash weekly scheduler | ✅ | Trigger wired + cron registration script |
| Dashboard pages (knowledge/cache/settings) | ✅ | |
| **Auth on all API routes** | ✅ | Block 1 fixed — all 10 routes now auth-gated |
| **QueryEvent persistence** | ✅ | Block 2 fixed — inference writes events, dashboard has real data |
| **Training pipeline correctness** | ✅ | Block 3 fixed — tenantId, temporal split, 7 DB fields |
| **Extension icons** | ❌ | Block 4 pending — build currently fails |
| **Extension service-worker** | ❌ | Block 4 pending — tenantId never injected |
| **Extension observer** | ❌ | Block 4 pending — blocks on "unknown" tenantId |
| **Billing price display** | ❌ | Block 5 pending — shows $49/$199 not $149/$499 |
| **Training page TRAINING style** | ❌ | Block 5 pending |
| **cache-controls error handling** | ❌ | Block 5 pending |
| **settings-tabs IP list fetch** | ❌ | Block 5 pending |
| **QStash cron idempotency** | ❌ | Block 5 pending |
| **Root bun run typecheck/lint** | ❌ | Block 6 pending |
| **next lint command fix** | ❌ | Block 6 pending |
| **gitignore additions** | ❌ | Block 6 pending |
| **Railway Dockerfile** | ❌ | Run F pending |
| **deploy.yml env validation step** | ❌ | Run F pending |
| **validate-env.sh** | ❌ | Run F pending |
| **Extension E2E test harness** | ❌ | Run F pending |

---

## 3. Environment Status

```
DATABASE_URL             ✅  Neon live
AUTH_SECRET              ✅  Set
AUTH_GOOGLE_ID           ✅  Fixed (stray newline removed)
AUTH_GOOGLE_SECRET       ✅  Set
UPSTASH_REDIS_REST_URL   ✅  Set
UPSTASH_REDIS_REST_TOKEN ✅  Set
UPSTASH_VECTOR_REST_URL  ✅  Set
UPSTASH_VECTOR_REST_TOKEN ✅ Set
QSTASH_TOKEN             ✅  Set
QSTASH_CURRENT_SIGNING_KEY ❌ Must add (needed by weekly-trigger)
QSTASH_NEXT_SIGNING_KEY  ❌  Must add
RESEND_API_KEY           ✅  Set — techsci.co NOT verified in Resend yet
POLAR_ACCESS_TOKEN       ❌  Placeholder — get from dashboard.polar.sh
POLAR_WEBHOOK_SECRET     ✅  polar_whs_tchCc4RyIugiKdb9XBKAXzLeCrXgzhGoPhdsA3TP0lD
POLAR_PRODUCT_ID_STARTER ✅  1500891c-b6ef-4270-9dea-acee7f679cc7
POLAR_PRODUCT_ID_GROWTH  ✅  f3459e45-a3f7-4355-ad00-85cd1d8d1365
POLAR_PRODUCT_ID_ENTERPRISE ✅ e40620eb-cb27-4577-81a2-1b6c88f2601a
INFERENCE_API_SECRET     ❌  Run: openssl rand -hex 32
INFERENCE_SERVICE_URL    ✅  http://localhost:8000 (dev) — needs Railway URL for prod
PILOT_TENANT_ID          ❌  Set after bun run setup:okbet (OKBET tenant DB id)
PIPELINE_DIR             ❌  Set to absolute path of pipeline/ in Railway
NEXT_PUBLIC_APP_URL      ❌  Set to https://autocsr.io in Vercel
```

### Schema additions pushed to Neon (Block 1):
```prisma
Tenant.cacheThreshold   Float    @default(0.92)
Tenant.authorizedIps    String[] @default([])
KnowledgeDocument       model    (new — full model with tenantId, name, type, sizeBytes, status, chunkCount)
TrainingRun.examplesUsed     Int?
TrainingRun.promoted         Boolean?
TrainingRun.baseModelVersion String?
TrainingRun.adapterVersion   String?
```

---

## 4. Architecture — Locked Decisions

- **Base model:** Hermes-3-Llama-3.1-8B + 5 LoRA adapters (~80MB each)
- **Replay buffer:** 70% old examples + 30% new — temporal split (sort by createdAt first, THEN split)
- **Daily retraining = catastrophic forgetting.** Weekly QLoRA only, QStash Sunday 02:00 UTC
- **Billing:** Polar (not Stripe). Sandbox requires `server: 'sandbox'`
- **Runtime:** Bun everywhere (never npm)
- **Inference deployment:** Railway (Heroku rejected)
- **Web deployment:** Vercel
- **Storage:** Appwrite (knowledge base docs, GitHub Education Pack)
- **Rust:** Explicitly ruled out — Python only for ML stack

### Design system (locked — do not deviate):
```
Surfaces:  #090910 base | #0f0f18 cards | #141420 hover
Borders:   rgba(255,255,255,0.06)
Text:      #e8e8f0 primary | #606075 sub | #30303f dim
Accent:    #4f46e5
Data vals: font-mono (JetBrains Mono) — NO EXCEPTIONS
Display:   Syne 700
```

Agent tag colors:
- deposit: green rgba(34,197,94,0.1) / #4ade80
- withdrawal: amber rgba(245,158,11,0.1) / #fbbf24
- verification: purple rgba(168,85,247,0.1) / #c084fc
- onboarding: blue rgba(59,130,246,0.1) / #60a5fa
- general: gray rgba(100,100,120,0.15) / #9ca3af

---

## 5. OKBET Pilot Config

```
Tenant slug:  okbet
Tier:         GROWTH (50,000 queries/month, $0 for 6 months per agreement)
Agreement:    OKBET-TECHSCI-DAA-FINAL, effective June 2, 2026; expires Dec 2, 2026
COO:          Wayne Thong (authorized signatory)
Authorized IPs: 153.53.253.81, 89.117.176.115, 103.170.173.26
```

Setup command (run once against production Neon):
```bash
bun run setup:okbet
```

---

## 6. Remaining Prompts — Copy-Paste Ready for Claude Code

### Block 4 — Chrome Extension Fixes

```
Read CLAUDE.md.

Fix 3 extension issues. All 3 must be done for bun run build to succeed
and for capture to produce usable training data.

--- Fix 1: Extension icons (build currently fails) ---

Run this script to generate placeholder icons:

Create packages/extension/scripts/gen-icons.mjs:

import { writeFileSync, mkdirSync } from "fs"

// Minimal 1px transparent PNG — placeholder until real design
const png1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
)

mkdirSync("icons", { recursive: true })
writeFileSync("icons/icon16.png",  png1x1)
writeFileSync("icons/icon48.png",  png1x1)
writeFileSync("icons/icon128.png", png1x1)
console.log("✅ placeholder icons created")

Run: cd packages/extension && node scripts/gen-icons.mjs

Then: bun run build — must succeed before continuing.

--- Fix 2: service-worker.ts — proper tenantId injection ---

Replace current service-worker.ts content entirely:

chrome.runtime.onInstalled.addListener(() => {
  // Extension installed — waiting for tenant configuration
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SESSION_START") {
    chrome.storage.session
      .set({ autocsr_tenant_id: message.tenantId, autocsr_active: true })
      .then(() => sendResponse({ ok: true }))
    return true
  }
  if (message.type === "SESSION_END") {
    chrome.storage.session
      .set({ autocsr_active: false })
      .then(() => sendResponse({ ok: true }))
    return true
  }
  if (message.type === "SESSION_SNAPSHOT") {
    chrome.action.setBadgeText({
      text:  String(message.messageCount),
      tabId: _sender.tab?.id,
    })
    chrome.action.setBadgeBackgroundColor({ color: "#4f46e5" })
    sendResponse({ ok: true })
    return false
  }
  if (message.type === "GET_TENANT_ID") {
    chrome.storage.session
      .get("autocsr_tenant_id")
      .then(data => sendResponse({ tenantId: data.autocsr_tenant_id ?? null }))
    return true
  }
  return false
})

--- Fix 3: observer.ts — block capture if tenantId unknown ---

Replace getTenantId() and startObserver() with async versions:

async function getTenantId(): Promise<string | null> {
  const data = await chrome.storage.session.get("autocsr_tenant_id")
  return (data.autocsr_tenant_id as string | undefined) ?? null
}

export async function startObserver(): Promise<void> {
  const tenantId = await getTenantId()
  if (!tenantId) {
    console.warn("[AutoCSR] tenantId not configured — capture blocked")
    return
  }
  if (observer) return

  sessionId        = crypto.randomUUID()
  sessionStartedAt = Date.now()

  const root = findLogRoot()
  if (!root) {
    console.warn("[AutoCSR] No conversation log root found")
    return
  }

  observer = new MutationObserver(() => {
    snapshot(tenantId).catch(console.error)
  })
  observer.observe(root, { childList: true, subtree: true })
  snapshot(tenantId).catch(console.error)
}

Update snapshot() signature: async function snapshot(tenantId: string): Promise<void>
Remove the getTenantId() call inside snapshot — use the parameter directly.

Update bottom of file:
if (document.readyState === "complete") {
  startObserver().catch(console.error)
} else {
  window.addEventListener("load", () => startObserver().catch(console.error))
}

--- Fix 4: popup.ts + index.html — tenant setup UI ---

In packages/extension/src/popup/index.html, add before </body>:
<div id="setup-section" style="display:none; margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.06)">
  <p style="color:#606075;font-size:11px;margin:0 0 6px">Tenant ID not configured</p>
  <input id="tenant-input" type="text" placeholder="Paste your tenant ID"
    style="width:100%;box-sizing:border-box;background:#141420;border:1px solid rgba(255,255,255,0.1);
           color:#e8e8f0;border-radius:4px;padding:4px 8px;font-size:11px;font-family:monospace"/>
  <button id="save-tenant"
    style="margin-top:6px;width:100%;padding:4px;background:#4f46e5;color:white;
           border:none;border-radius:4px;cursor:pointer;font-size:11px">
    Save & Start Capture
  </button>
</div>

In popup.ts, add after refreshStats() call:

async function checkSetup() {
  const data = await chrome.storage.session.get("autocsr_tenant_id")
  if (!data.autocsr_tenant_id) {
    document.getElementById("setup-section")!.style.display = "block"
  }
}

document.getElementById("save-tenant")?.addEventListener("click", async () => {
  const input = (document.getElementById("tenant-input") as HTMLInputElement).value.trim()
  if (!input) return
  await chrome.runtime.sendMessage({ type: "SESSION_START", tenantId: input })
  document.getElementById("setup-section")!.style.display = "none"
  document.getElementById("status")!.textContent = `Active — tenant …${input.slice(-8)}`
})

checkSetup()

--- VALIDATION ---
cd packages/extension && bun run build — clean dist/, zero errors, icons present
```

---

### Block 5 — UI Correctness Fixes

```
Read CLAUDE.md.

Five targeted UI fixes. All are wrong values or missing error handling.

--- Fix 1: Billing prices ($49/$199 → $149/$499) ---

Open apps/web/app/(dashboard)/settings/billing/page.tsx
Change every occurrence of:
  $49  → $149
  $199 → $499
These must match Polar sandbox product config exactly.

--- Fix 2: Training page — TRAINING status style missing ---

Open apps/web/app/(dashboard)/training/page.tsx
In the status badge style map, find the existing entries and ADD:
  TRAINING: "bg-[rgba(99,102,241,0.1)] text-[#818cf8] border border-[rgba(99,102,241,0.2)]"

--- Fix 3: cache-controls.tsx — check res.ok before reporting success ---

Open apps/web/components/dashboard/cache-controls.tsx

In the clear cache handler, replace optimistic update with:
  const res = await fetch("/api/cache/clear", { method: "DELETE" })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }))
    setError(err.error ?? "Failed to clear cache")
    return
  }
  const data = await res.json()
  setSuccess(`Cleared ${data.count ?? 0} vector entries`)

Add an error state (useState<string | null>) and render it below the button in red.

In the threshold save handler:
  const res = await fetch("/api/cache/threshold", { method: "PATCH", ... })
  if (!res.ok) {
    setError("Failed to save threshold")
    return
  }

--- Fix 4: settings-tabs.tsx — load authorized IPs from server on mount ---

Open apps/web/components/dashboard/settings-tabs.tsx

In the API Access tab (authorized IPs section):
1. Add state: const [ips, setIps] = useState<string[]>([])
2. Add useEffect:
   useEffect(() => {
     fetch("/api/settings/authorized-ips")
       .then(r => r.ok ? r.json() : { ips: [] })
       .then(d => setIps(d.ips ?? []))
   }, [])
3. In POST success handler: setIps(prev => [...prev, newIp]) only after res.ok
4. In DELETE handler: setIps(prev => prev.filter(i => i !== ip)) only after res.ok

--- Fix 5: QStash cron idempotency — exact URL match + stale cleanup ---

Open apps/web/scripts/register-qstash-cron.ts

Replace the existing idempotency check with:
  const TRIGGER_URL = `${env.INFERENCE_SERVICE_URL}/api/training/weekly-trigger`
  const schedules   = await qstash.schedules.list()

  // Remove stale schedules pointing to old URL (e.g. ngrok)
  for (const s of schedules) {
    if (s.destination?.includes("/api/training/weekly-trigger") && s.destination !== TRIGGER_URL) {
      await qstash.schedules.delete(s.scheduleId)
      console.log("🗑  Deleted stale schedule:", s.scheduleId)
    }
  }

  const existing = schedules.find(s => s.destination === TRIGGER_URL)
  if (existing) {
    console.log("⚠️  Schedule already registered:", existing.scheduleId)
    return
  }
  // proceed to create

--- VALIDATION ---
bun run typecheck (apps/web) — zero errors
bun run dev — verify billing page shows $149/$499, training status styles correct
```

---

### Block 6 — Repo Hygiene

```
Read CLAUDE.md.

Four hygiene fixes. These are breaking CI and causing confusion.

--- Fix 1: Root package.json — add working typecheck + lint ---

Open root package.json (autocsr/package.json). Add to scripts:
  "typecheck": "bun run --cwd apps/web typecheck",
  "lint":      "bun run --cwd apps/web lint"

--- Fix 2: Fix next lint in apps/web/package.json ---

Open apps/web/package.json. Replace:
  "lint": "next lint"
With:
  "lint": "next lint --dir app --dir components --dir lib --dir types"

--- Fix 3: .gitignore additions ---

Open root .gitignore. Add if not present:
  # Local AI tool directories
  .codex/
  .serena/
  .playwright-mcp/
  # macOS
  .DS_Store
  **/.DS_Store
  # TypeScript build info
  *.tsbuildinfo
  # Python
  **/__pycache__/
  **/*.pyc
  pipeline/data/
  pipeline/models/

--- Fix 4: Remove console.log from extension service-worker ---

In packages/extension/src/background/service-worker.ts:
Replace any remaining console.log("AutoCSR extension installed") or similar
install/startup log with a comment only.

--- VALIDATION ---
bun run typecheck    (from repo root) — delegates to apps/web, zero errors
bun run lint         (from repo root) — no errors
cd packages/extension && bun run build — clean
```

---

### Run F — Production Deploy Prep

```
Read CLAUDE.md.

Pre-production hardening. Everything here enables the GitHub Actions pipeline
to deploy Vercel + Railway correctly.

--- TASK 1: apps/inference/Dockerfile ---

FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl git && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=8000
EXPOSE $PORT
CMD uvicorn main:app --host 0.0.0.0 --port $PORT

Create apps/inference/.dockerignore:
  __pycache__/
  *.pyc
  .env
  .env.*
  models/
  data/
  .venv/

--- TASK 2: apps/inference/railway.toml ---

[build]
  builder = "DOCKERFILE"
  dockerfilePath = "apps/inference/Dockerfile"

[deploy]
  startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
  restartPolicyType = "ON_FAILURE"
  restartPolicyMaxRetries = 3

--- TASK 3: apps/web/scripts/validate-env.sh ---

Create this script — called by CI before build:

#!/bin/bash
set -e
REQUIRED=(
  DATABASE_URL AUTH_SECRET AUTH_GOOGLE_ID AUTH_GOOGLE_SECRET
  UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN
  UPSTASH_VECTOR_REST_URL UPSTASH_VECTOR_REST_TOKEN
  QSTASH_TOKEN QSTASH_CURRENT_SIGNING_KEY QSTASH_NEXT_SIGNING_KEY
  RESEND_API_KEY
  POLAR_ACCESS_TOKEN POLAR_WEBHOOK_SECRET
  POLAR_PRODUCT_ID_STARTER POLAR_PRODUCT_ID_GROWTH POLAR_PRODUCT_ID_ENTERPRISE
  INFERENCE_API_SECRET INFERENCE_SERVICE_URL NEXT_PUBLIC_APP_URL
)
MISSING=()
for var in "${REQUIRED[@]}"; do
  [[ -z "${!var}" ]] && MISSING+=("$var")
done
if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "❌ Missing env vars:"
  printf "   %s\n" "${MISSING[@]}"
  exit 1
fi
echo "✅ All required env vars present"

chmod +x apps/web/scripts/validate-env.sh

--- TASK 4: Update .github/workflows/deploy.yml ---

Add env validation step before "Build project" in deploy-vercel job.
Pass all 21 required vars as env: from ${{ secrets.VAR_NAME }}.

--- TASK 5: Extension E2E test harness ---

Create packages/extension/test/mock-liveagent.html — static page
mimicking LiveAgent DOM so you can test locally without real OKBET access:

<!DOCTYPE html>
<html>
<head><title>Mock LiveAgent — AutoCSR Test</title>
<style>body{background:#1a1a2e;color:#e8e8f0;font-family:monospace;padding:20px}</style>
</head>
<body>
  <h3>Mock LiveAgent — AutoCSR E2E Test Page</h3>
  <div role="log" id="conversation-log">
    <div role="article" data-testid="message-0">
      <span data-testid="message-role">customer</span>
      <span data-testid="message-content">my gcash deposit of 5000 php is not showing</span>
      <time datetime="2026-06-08T10:00:00Z">10:00</time>
    </div>
    <div role="article" data-testid="message-1">
      <span data-testid="message-role">agent</span>
      <span data-testid="message-content">Let me check that for you right away.</span>
      <time datetime="2026-06-08T10:00:30Z">10:00</time>
    </div>
  </div>
  <script>
    // Simulate new PII-bearing message after 3s — test anonymizer
    setTimeout(() => {
      const log = document.getElementById("conversation-log")
      const msg = document.createElement("div")
      msg.setAttribute("role", "article")
      msg.setAttribute("data-testid", "message-2")
      msg.innerHTML = `
        <span data-testid="message-role">customer</span>
        <span data-testid="message-content">my email is john@example.com account 1234567890</span>
        <time datetime="2026-06-08T10:01:00Z">10:01</time>
      `
      log.appendChild(msg)
      console.log("[Mock] PII message added — anonymizer should fire")
    }, 3000)
  </script>
</body>
</html>

Add to manifest.json host_permissions (dev only): "file:///*"

Create packages/extension/README-testing.md with E2E test steps:
1. bun run build
2. Load dist/ as unpacked in chrome://extensions
3. Open test/mock-liveagent.html (file:// URL)
4. Open popup — enter any test tenant ID, click Save
5. Watch message count increment; after 3s, count goes to 3
6. Export XML — john@example.com → [EMAIL], 1234567890 → [ACCOUNT_ID], 5000 → [AMT_MD]
7. Export encrypted JSON — verify it's base64 blob not readable JSON
For production: get LiveAgent subdomain URL from Wayne Thong, add to host_permissions

--- TASK 6: next.config.ts security headers ---

Add to existing next.config.ts:
  async headers() {
    return [{
      source: "/api/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options",        value: "DENY" },
        { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
      ],
    }]
  }

--- VALIDATION ---
bun run typecheck (apps/web) — zero errors
cd packages/extension && bun run build — clean
bash apps/web/scripts/validate-env.sh (with .env.local sourced) — all present
```

---

## 7. Post-Deploy Manual Steps (after all blocks + Run F)

```bash
# 1. Generate INFERENCE_API_SECRET
openssl rand -hex 32
# → add to .env.local, Vercel env, Railway env

# 2. Set up OKBET tenant in production Neon
bun run setup:okbet

# 3. Get LiveAgent subdomain from Wayne Thong → update extension host_permissions → rebuild

# 4. Add GitHub Secrets (Settings → Secrets → Actions) — full list in validate-env.sh

# 5. Push to main → GitHub Actions deploys Vercel + Railway

# 6. Once Railway is live, update INFERENCE_SERVICE_URL → re-register QStash cron
bun run cron:register

# 7. DNS: autocsr.io A record → Vercel IP (from Vercel project settings)

# 8. Verify Resend domain techsci.co at resend.com/domains

# 9. OKBET tier confirmed in Neon:
psql $DATABASE_URL -c "SELECT id, tier, \"queryLimit\" FROM \"Tenant\" WHERE slug='okbet';"
```

---

## 8. Key Technical Notes (don't re-derive these)

- **otplib API v13:** use `authenticator` not `totp`
- **Turbopack:** do NOT set `turbopack.root` in next.config.ts — causes build failures
- **Polar SDK sandbox:** requires `server: 'sandbox'` param; checkout uses `products` array with `productId`
- **dotenv-cli:** always use `bun run db:*` scripts — never call prisma directly
- **Upstash Vector namespace:** tenant isolation via namespace = tenantId
- **QueryEvent write:** wrapped in try/catch, never raises — inference crash protection
- **Weekly training:** Sunday 02:00 UTC via QStash; QLoRA only, no daily retraining
- **convert.py split:** sort by createdAt ASC FIRST, split at 70% boundary, THEN shuffle

---

## 9. Commits Made This Session

```
45dea0b  feat(security): env hardening, inference auth, OKBET pilot config
07b8cd5  pipeline automation + schema synchronization
+ uncommitted: Block 1 (auth), Block 2 (QueryEvent), Block 3 (pipeline fixes)
```

**Recommended commit message for current changes:**
```
fix: auth all API routes, QueryEvent persistence, pipeline tenant-scope + temporal split
```

---

*Handoff v3 — June 8, 2026 | AutoCSR v0.5 | TechSci, Inc.*
