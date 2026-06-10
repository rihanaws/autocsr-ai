# Archive — Frozen Historical Handoffs

These files are **frozen historical handoffs and point-in-time reviews**. They are NOT current state and must never be used as a source of truth. For current state see `STATUS.md` (repo root); for visual rules see `apps/web/DESIGN_SYSTEM.md`; for the authority hierarchy see CLAUDE.md "Document Authority" and ADR `docs/decisions/0001-document-authority.md`.

Files are moved here unchanged (`git mv`, history preserved). Do not edit them.

## Index

| File | Date | What it was |
|------|------|-------------|
| `session-state-2026-06-08.md` | 2026-06-08 | Session handoff after Weeks 1–4 + security/pipeline fix pass. Resume instructions, build-status table, Blocks 4–6 plan. Superseded by STATUS.md. |
| `CODEBASE_REVIEW_2026-06-08.md` | 2026-06-08 (committed 2026-06-09) | Codex 5.5 full-codebase review: web routes, inference service, semantic cache, training pipeline, extension. Findings since addressed in Blocks 3.5–10. |

## Pending arrivals

- `docs/session-state-2026-06-10-security-audit.md` — AI/inference security audit (against a repomix export) with open Critical items (C2/C3/C4/C5). Stays in `docs/` until those close, then moves here. Caveats recorded in STATUS.md: C1 and parts of C2/M4 were verified stale against the live repo on 2026-06-10.
