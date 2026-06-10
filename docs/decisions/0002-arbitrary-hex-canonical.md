# ADR 0002 — Arbitrary-hex classes are the canonical token mechanism (pilot phase)

Date: 2026-06-10
Status: Accepted

## Context

A design-system audit (2026-06-10) found ~586 hardcoded hex occurrences across 30+ `.tsx` files, while every color token defined in the `globals.css` `@theme` block had **zero** usages. Four documents (CLAUDE.md, BRAND.md, `.claude/skills/design-system.md`, `globals.css`) disagreed on canonical values. `.claude/rules/styling.md` explicitly mandates arbitrary-value classes (`bg-[#0f0f18]`) and forbids Tailwind `color-*` classes — the codebase follows that rule consistently.

Two options:

- **A — migrate to `@theme` utility classes:** rename tokens readably, rewrite ~586 occurrences across ~30 files.
- **B — bless arbitrary-hex as canonical:** document the exact palette in one authoritative file; defer migration.

## Decision

**Option B.** Arbitrary-value classes with exact hex values are the canonical styling mechanism for the pilot phase. The single source of truth for legal values is `apps/web/DESIGN_SYSTEM.md`. Dead/conflicting `@theme` color tokens were removed from `globals.css`; only font tokens and the remapped shadcn semantic vars remain.

## Rationale

- No test suite exists; a 30-file visual refactor cannot be regression-checked.
- OKBET pilot launch is pending; visual churn risk outweighs token ergonomics.
- The drift problem is documentation disagreement, not the hex mechanism itself — fixed by making DESIGN_SYSTEM.md the sole authority.

## Consequences

- New UI code uses arbitrary hex from DESIGN_SYSTEM.md §2 only; values not listed there are banned (§6 Never-Use table).
- `.claude/rules/styling.md` stays, with an added line pointing to DESIGN_SYSTEM.md as the only source of legal hex values.
- **Post-pilot:** intended migration to readable `@theme` tokens (`bg-surface` etc.) across the affected files, tracked in DESIGN_SYSTEM.md §7. Revisit after pilot stabilizes and a visual-regression check exists.
