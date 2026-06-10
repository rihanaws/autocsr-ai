# AutoCSR — Status & Backlog

Updated: 2026-06-10

## Current

- Week 5 in progress. Remaining: Run F (production deploy prep).
- Design-system drift killed (2026-06-10): `apps/web/DESIGN_SYSTEM.md` is the single source of truth for all visual tokens and component rules (see ADR `docs/decisions/0002-arbitrary-hex-canonical.md`). Commit: _pending_.

## Backlog

| Priority | Item | Source |
|----------|------|--------|
| LOW | Implement `prefers-reduced-motion` support — required before any `motion/react` usage lands | DESIGN_SYSTEM.md §4 |
| LOW | `ui/badge.tsx` `rounded-4xl` pill exceeds the 12px radius cap | DESIGN_SYSTEM.md §3 |
| LOW | Remove inert `dark:` variant classes from `components/ui/*` (no `.dark` class exists) | DESIGN_SYSTEM.md §5 |
| POST-PILOT | Token migration: promote DESIGN_SYSTEM.md §2 palette to readable `@theme` tokens, migrate ~586 arbitrary-hex usages across ~30 files | ADR 0002 / DESIGN_SYSTEM.md §7 |
| POST-PILOT | Fix Never-Use hex violations in the 13 files listed in DESIGN_SYSTEM.md §8 | DESIGN_SYSTEM.md §6/§8 |
| MEDIUM | 24 Dependabot vulnerabilities — `gh api /repos/rihanaws/autocsr-ai/dependabot/alerts` | CLAUDE.md Known Gaps |
