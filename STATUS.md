# AutoCSR — Status & Backlog

> SINGLE source of truth for what is built/verified (see CLAUDE.md "Document Authority", ADR 0001).
> A feature is done only when its verification command passes. No other document may assert completion status.

Updated: 2026-06-10

## Current

- Week 5 in progress. Remaining: Run F (production deploy prep).
- NEXT: documentation-hierarchy pass ("Prompt 2") complete → Block A.
- OPEN: security-audit Critical items — see "Security Audit (2026-06-10)" below. Audit doc: `docs/session-state-2026-06-10-security-audit.md` (stays out of archive until C-items close).

## Security Audit (2026-06-10) — open items

Source: `docs/session-state-2026-06-10-security-audit.md` (audited a repomix export; several claims verified STALE against live repo 2026-06-10 — re-verify each item against current code before acting).

| Item | Claim | Verified against live repo |
|------|-------|---------------------------|
| C1 | `_env.local` + `client_secret_*.json` committed with live secrets | ⚠️ **EXPOSED-VIA-EXPORT (not via git)**. Files never tracked; git history clean (`git ls-files` + `git log --all --diff-filter=A` empty); filter-repo scrub N/A. Exposure vector: repomix export bundled `_env.local` (underscore name dodged the `.env.local` gitignore rule); export was shared with an external AI reviewer (Claude.ai "CSR AI" project context only). Treat ALL credentials in C1 as compromised. Rotation: Neon password ✅, AUTH_SECRET ✅, Google OAuth secret ✅, Polar token + webhook secret ✅, Resend key ✅, Upstash Redis/Vector/QStash tokens ✅, INFERENCE_API_SECRET ✅ — all rotated, new values set in GitHub Actions secrets (owner-confirmed 2026-06-11). Preventive excludes shipped: `.gitignore` + `.repomixignore` (this commit). |
| C2 | Inference: shared secret only, `tenant_id` trusted from body; "no IP check in main.py" | IP-allowlist sub-claim **CLOSED** (main.py:91/107/316, DB-driven). Core gap **OPEN**: single shared `INFERENCE_API_SECRET`, no per-tenant binding of tenant_id to caller — **Block B still required**. |
| C3 | No prompt-injection defense in agents | OPEN — not re-verified. |
| C4 | `_is_csr_relevant` substring matching is a no-op scope filter | OPEN — not re-verified. |
| C5 | Flagged/low-confidence responses get cached and replayed (intra-tenant cache poisoning) | OPEN — Block 10 wired threshold but flagged-response write-gating not confirmed. |
| H1–H5, M1–M3 | Rate limiting, auditor async, output guard, extension vault/start-stop, anonymizer, webhook map, slug collision | OPEN — not re-verified. |
| M4 | weekly-trigger unauthenticated | **CLOSED**: QStash HS256 JWT verified (main.py:432/467, Block 7). |
- Design-system drift killed (2026-06-10): `apps/web/DESIGN_SYSTEM.md` is the single source of truth for all visual tokens and component rules (see ADR `docs/decisions/0002-arbitrary-hex-canonical.md`). Commit: `8b32b5e`.

## Shipped (verified)

| Scope | What | Verified by |
|-------|------|-------------|
| Weeks 1–4 | Dashboard, auth, billing (Polar sandbox), landing, email | typecheck/lint/build green; manual flows |
| Week 5 | Env hardening (`lib/env.ts` Zod), OKBET pilot config, training pipeline (`pipeline/`), QStash weekly cron (`scd_774mX3PfErmkHCEDcjedjkG7Vs4s`), dashboard pages, API auth-guard pass, QueryEvent persistence, pipeline correctness fixes, Block 3.5 security fixes, Block 4 extension fixes, Block 5 UI correctness, Block 6 repo hygiene, Block 7 inference/pipeline critical fixes | typecheck/lint/build green; commit `803e889` et al. |
| Jun 9 | Font system (Geist+Inter npm), SEO metadata, robots.txt, sitemap.ts, legal pages (terms/privacy/refund), BRAND.md, MASTER_PLAN amended, footer with legal links, OG image | typecheck/lint/build green |
| Jun 10 | Session Redis cache (60s TTL); knowledge pipeline upload→chunk→embed→retrieve (commit `a3ea0a8`); Upstash Vector index AUTOCSR-AI-V2 (bge-base-en-v1.5) replacing dead picked-eel index; security fixes (commit `0d28bff`): retrieve_knowledge per-result tenant_id+type re-check, embed endpoint input validation `[A-Za-z0-9_-]{1,64}` | smoke-tested upsert-data + query-data with metadata filter |
| Jun 10 | Design-system canon (commits `8b32b5e` + `03c1605`): DESIGN_SYSTEM.md created, ADR 0002, Syne/DM Sans purged, circular font-var chains fixed, shadcn `:root` remapped dark, BRAND.md voice-only, STATUS.md created | typecheck/lint/build green; /login pixel-checked |
| Jun 10 | Block 10 feature-gap fixes: cacheThreshold wired fail-closed, cache_lookup/cache_write rename + `type="cache"` tagging, /demo page, real disconnect endpoint (Polar `subscriptions.revoke`) | typecheck/lint green |
| Jun 10 | Document Authority hierarchy (ADR 0001): CLAUDE.md de-duplicated, historical docs archived to docs/archive/ | validation block in ADR 0001 |

## Verification

Standard gate for any "done" claim:

```sh
bun run typecheck   # exit 0
bun run lint        # exit 0
bun run build       # green (run in apps/web context via root script)
```

Feature-specific checks live in the row that claims them ("Verified by" column).

## Backlog

| Priority | Item | Source |
|----------|------|--------|
| LOW | Implement `prefers-reduced-motion` support — required before any `motion/react` usage lands | DESIGN_SYSTEM.md §4 |
| LOW | `ui/badge.tsx` `rounded-4xl` pill exceeds the 12px radius cap | DESIGN_SYSTEM.md §3 |
| LOW | Remove inert `dark:` variant classes from `components/ui/*` (no `.dark` class exists) | DESIGN_SYSTEM.md §5 |
| POST-PILOT | Token migration: promote DESIGN_SYSTEM.md §2 palette to readable `@theme` tokens, migrate ~586 arbitrary-hex usages across ~30 files | ADR 0002 / DESIGN_SYSTEM.md §7 |
| POST-PILOT | Fix Never-Use hex violations in the 13 files listed in DESIGN_SYSTEM.md §8 | DESIGN_SYSTEM.md §6/§8 |
| MEDIUM | 24 Dependabot vulnerabilities — `gh api /repos/rihanaws/autocsr-ai/dependabot/alerts` | CLAUDE.md Known Gaps |
| MEDIUM | Rename `Tenant.stripeCustomerId` → Polar naming (deferred to Run F) | CLAUDE.md disconnect notes |
| LOW | AGENTS.md (Codex context) drifted: says Next.js 15, embeds stale design-token hex list, points at `.Codex/skills/design-system.md` — re-sync to Document Authority hierarchy | doc-hierarchy audit 2026-06-10 |
