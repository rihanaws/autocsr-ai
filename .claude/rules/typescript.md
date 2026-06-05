---
paths:
  - "apps/web/**/*.ts"
  - "apps/web/**/*.tsx"
  - "packages/extension/**/*.ts"
---
# TypeScript Rules

- Strict mode always. No `any`. No `!` non-null assertions without comment.
- Server Components by default. 'use client' only for: useState, useEffect,
  event handlers, browser APIs, SWR polling.
- After ANY TypeScript edit: run `bun run typecheck` and fix all errors before stopping.
- DB queries in Server Components only. Never fetch from useEffect.
- ALL DB queries must include `where: { tenantId: session.user.tenantId }`.
- Server Actions live in actions.ts colocated with their page.
- No `src/` folder. Ever.
