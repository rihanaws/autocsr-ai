# ADR 0001 — Document Authority Hierarchy

**Status:** Accepted
**Date:** 2026-06-10

> Numbering note: ADR 0002 (arbitrary-hex canonical) was written hours before this one, during the same design-system pass. 0001 was reserved for the authority decision itself; both are dated 2026-06-10.

## Context

Project state was asserted in five or more places with no document declaring authority over the others:

- CLAUDE.md carried a growing "Build Status" ledger plus duplicated font/color/token specs.
- session-state-*.md handoff files froze point-in-time status that kept being read as current.
- Codex rollout context (AGENTS.md) drifted independently (stale stack version, stale token list).
- Review/audit documents (e.g. CODEBASE_REVIEW_2026-06-08.md) recorded findings that were later fixed, but the documents still read as open.
- DESIGN_SYSTEM.md and BRAND.md both carried visual guidance until 2026-06-10.

Consequence: recurring "marked done but actually a stub" failures — a feature was declared complete in one document while another (or the code) showed it unimplemented. There was no rule for which document wins on conflict, and no single place a completion claim had to be verified.

## Decision

Establish an explicit document hierarchy, recorded at the top of CLAUDE.md ("Document Authority" section):

- **STATUS.md** — SINGLE source of truth for what is built/verified. Nothing else may assert completion status. A feature is done only when its STATUS.md verification command passes.
- **apps/web/DESIGN_SYSTEM.md** — SINGLE source of truth for visual tokens and component rules. Supersedes any visual guidance elsewhere.
- **CLAUDE.md** — rules, conventions, stack, commands, and pointers to the above. Contains no completion-status claims and no duplicated token specs.
- **docs/decisions/** — dated, append-only ADRs. Read for "why", never for "current state". Never edited after writing.
- **docs/archive/** (session-state-*, old reviews) — frozen historical handoffs. Never a source of truth.

Conflict-resolution rule:

> If two documents conflict, authority order is: STATUS.md / DESIGN_SYSTEM.md > CLAUDE.md > docs/decisions/ > session-state-*. Lower-authority documents must never be used to override a higher one. When you complete or change project state, update STATUS.md FIRST.

Accompanying mechanical changes (same pass):

- CLAUDE.md de-duplicated: Build Status ledger moved to STATUS.md "Shipped" table; font/color/token specs replaced with pointers to DESIGN_SYSTEM.md.
- STATUS.md gained a Verification section (typecheck/lint/build gate) and a per-row "Verified by" column.
- session-state-2026-06-08.md and CODEBASE_REVIEW_2026-06-08.md moved unchanged to docs/archive/ with an index README.

## Consequences

Positive:

- One place to check (and update) completion status; "done" requires a passing verification command, which directly attacks the stub-recurrence failure mode.
- New sessions/agents read CLAUDE.md top-first and learn the hierarchy before touching any stale document.
- Historical handoffs remain available for archaeology without masquerading as current state.

Negative / costs:

- Discipline cost: every state change must touch STATUS.md first; CLAUDE.md edits must resist re-accumulating status lines.
- AGENTS.md (Codex context) is outside this hierarchy's enforcement and already drifted; it needs a separate re-sync (tracked in STATUS.md backlog).
- ADRs being append-only means superseding a decision requires a new ADR rather than an edit.
