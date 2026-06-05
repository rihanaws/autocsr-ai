# AutoCSR — Claude Code Context

## Project
AI-native CSR automation SaaS for online betting.
Owner: TechSci, Inc. / Sayem Abdullah Rihan
Client: OKBET (Gavin Ventures, Inc.) — Growth tier, free 6 months post-deploy
Repo: https://github.com/rihanaws/autocsr-ai (private, branch: main)

## CRITICAL — Package Manager
Always bun. Never npm/yarn/pnpm.
`bun install` | `bun add <pkg>` | `bun run <script>` | `bunx <bin>`

## CRITICAL — Database
Never call prisma directly. Always use `bun run db:*` scripts.
Scripts use dotenv-cli to load .env.local automatically.

## Stack
Runtime: Bun | Frontend: Next.js 15 App Router (NO src/ folder)
Language: TypeScript strict | UI: Shadcn/ui + Tailwind CSS v4
Animation: Motion — import from 'motion/react'
DB: Neon PostgreSQL + Prisma 6 | Cache: Upstash Redis + Vector
Queue: Upstash QStash | Auth: NextAuth.js v5 | Billing: Polar (sandbox)
Email: Resend + React Email | Inference: FastAPI Python 3.11 + LangGraph
Model: Hermes-3-Llama-3.1-8B + LoRA adapters

## Key Rules
- No src/ folder — ever
- Server Components default — 'use client' only for interactivity
- Tailwind v4: @import "tailwindcss" in globals.css, @theme {} for tokens
- DB queries MUST filter by tenantId from session (never from request body)
- ALL numbers/timestamps/agent names → font-mono (JetBrains Mono) — no exceptions
- Extension: ARIA + data-attributes only, never CSS class selectors
- Read .claude/skills/design-system.md before writing any new UI component
- Do NOT set turbopack.root in next.config.ts — causes build failures
- global-error.tsx required in app/ for proper error boundaries

## Design Tokens (use exact values — no Tailwind color-* for custom colors)
bg-base:#090910 | bg-surface:#0f0f18 | bg-surface-2:#141420
border:rgba(255,255,255,0.06) | border-strong:rgba(255,255,255,0.12)
text:#e8e8f0 | text-sub:#606075 | text-dim:#30303f
accent:#4f46e5 | accent-glow:rgba(79,70,229,0.12)
green:#22c55e | amber:#f59e0b | red:#ef4444
font-display:Syne 700 | font-body:DM Sans | font-mono:JetBrains Mono

## Build Status
Weeks 1–3: COMPLETE
Week 4: IN PROGRESS — read .claude/skills/week4-tasks.md

## Commands
bun run dev           # Next.js turbopack
bun run typecheck     # tsc --noEmit — run after every TS change
bun run db:push       # Prisma schema → Neon
bun run db:generate   # regenerate Prisma client
bun run db:studio     # Prisma Studio GUI
bun run email:dev     # React Email preview at localhost:3001
cd packages/extension && bun run build
cd apps/inference && uvicorn main:app --reload --port 8000
