# Week 4 Tasks

## Completed ✅
- [x] Dashboard design polish — design tokens applied uniformly
- [x] Profile dropdown + logout
- [x] Usage meter in sidebar
- [x] Profile & Security page with TOTP 2FA
- [x] Billing page (/settings/billing)
- [x] Landing page enhancement — trust, social proof, FAQ sections
- [x] Fix metrics counter seed values (4821 / 94ms / 61%)
- [x] Font fix: Google Fonts in dashboard layout

## Pending

### Priority 1 — Must finish before OKBET pilot
- [x] Polar sandbox: wire real product IDs + test checkout flow (2026-06-05)
- [x] Welcome email (Resend + React Email) (2026-06-05)
- [x] app/global-error.tsx — create required error boundary
- [x] lib/env.ts — Zod runtime validation, fail-fast on missing vars (2026-06-08)
- [x] Inference: HTTPBearer auth + OKBET IP allowlist + XFF spoofing fix (2026-06-08)
- [x] chat/route.ts: env.ts, X-Client-IP forwarding, 10s timeout/504 (2026-06-08)
- [x] scripts/setup-okbet-tenant.ts — idempotent OKBET tier promotion (2026-06-08)

### Priority 2 — Core pipeline
- [ ] Training pipeline: pipeline/finetune.py (Unsloth QLoRA)
- [ ] QStash weekly scheduler → /api/training/weekly-trigger
- [ ] Chrome extension E2E test on live LiveAgent session

### Priority 3 — Remaining dashboard pages
- [ ] Knowledge: embedding generation on chunk create
- [ ] Cache page: wire real Upstash Vector stats
- [ ] Settings: webhook test endpoint
