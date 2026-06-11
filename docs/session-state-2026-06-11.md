# Session State — 2026-06-11

> Handoff artifact for the AutoCSR "CSR AI" Claude project. Paste-resume: start a new chat in
> this project, attach or reference this file, and say "resume from session-state-2026-06-11".
> Authority note: STATUS.md in the repo is the source of truth for completion state (ADR 0001) —
> this file is a frozen conversation handoff, never current state.

## 1. Primary Request and Intent

Original intent: decide what to do next on AutoCSR after Week-2+ buildout, and whether the
**HOUZi24 canned-message data** (3 HTML sheets of Bengali/Banglish CSR responses, organized by
support category: register / deposit / withdraw / lottery-ticket flows) should be ingested into
the product's knowledge base.

Intent shifted twice, both user-driven:
1. → "Solve the multi-doc drift problem FIRST, then development" — after two independent reviews
   (Codex 2026-06-07, security audit 2026-06-10) kept disagreeing with CLAUDE.md "done" claims.
2. → Production deploy got pulled forward (Vercel + Railway now LIVE as of 2026-06-11), so the
   next development job is now **Block C security remediation**, then the canned-message ingest
   (blocked on multilingual embeddings).

Standing meta-intent: user executes via Claude Code one block per session, wants
**complete copy-paste-ready prompts** with explicit file paths and numbered validation steps,
brutal honesty, senior-architect framing. User is NEW to Claude Cowork and wants onboarding
guidance for using it on this project.

## 2. Key Concepts Established

- **Document Authority hierarchy (ADR 0001):** STATUS.md / DESIGN_SYSTEM.md > CLAUDE.md >
  docs/decisions/ > session-state-*. "Done" = verification command passes. Update STATUS.md FIRST.
- **Verification-gated done:** never mark complete from memory; every claim needs a command.
- **EXPOSED-VIA-EXPORT:** C1 secrets were never in git — leak vector was the repomix export
  bundling `_env.local` (underscore dodged `.env.local` gitignore rule). Rotation required;
  history scrub N/A.
- **Block lettering (security audit fix sequence):** A=secret hygiene (done/adapted),
  B=per-tenant inference auth, C=injection+scope (C3/C4), D=cache write-gating (C5),
  E=rate-limit/quota (H1), F=auditor async (H2), G=extension integrity (H4/H5), H=mediums.
  (Note: "Run F" separately = production deploy — now done. Don't confuse with audit Block F.)
- **Multilingual embedding blocker:** Upstash index AUTOCSR-AI-V2 uses `BAAI/bge-base-en-v1.5`
  (English-only). Bengali/Banglish content cannot be ingested until index migrates to a
  multilingual model (bge-m3 if Upstash offers it) or external embeddings.
- **HOUZi24 = OKBET brand** — covered by existing OKBET DAA; same tenant, no new agreement.

## 3. Research Findings

- Codex rollout (2026-06-07) → ~7 findings already fixed by June 8–10 work → reviews must be
  timestamped-reconciled against STATUS.md before acting; never treat old reviews as to-do lists.
- Security audit (2026-06-10, ran against repomix export) → 3 claims verified STALE against live
  repo (C1 git-committed: false; C2 "no IP check": false, wired main.py:91/107/316; M4
  weekly-trigger unauth: false, JWT at main.py:432/467). C3/C4/C5/H1–H5/M1–M3 remain OPEN.
- Design-system audit (Claude Code, 2026-06-10) → 31/100 severe drift; @theme tokens 0 usages vs
  ~586 hardcoded hex; `.claude/skills/design-system.md` was the active drift generator (taught
  deprecated Syne/DM Sans); shadcn primitives rendered light oklch (no `.dark` class). All fixed
  in commits `8b32b5e` + `03c1605`.
- requirements.txt pins were fictional (`upstash-vector==1.1.6` never existed on PyPI); rewritten
  from pyenv reality; PyJWT was imported-but-undeclared. Implication: never trust pinned versions
  that weren't generated from a working env.

## 4. Active Artifacts — Current State

| Artifact | State | Last action | Remaining |
|---|---|---|---|
| `STATUS.md` (repo root) | LIVE authority doc, updated 2026-06-11 | Deploy session rows added; C1 marked rotated ✅ all 11 creds | Maintain on every state change |
| `apps/web/DESIGN_SYSTEM.md` | Canonical visual authority, commit `8b32b5e` | Never-Use table, fg-var remap verified | Post-pilot token migration (§7) |
| `docs/decisions/0001-document-authority.md` | Accepted, frozen | Written | — |
| `docs/decisions/0002-arbitrary-hex-canonical.md` | Accepted, frozen | Written | — |
| `CLAUDE.md` | De-duplicated, pointers-only, Document Authority section at top | Synced with deploy session | Resist status-line re-accumulation |
| `SECURITY-REMEDIATION-BLOCKS.md` (chat output, NOT in repo) | Block A executed/adapted; **Blocks C and D prompts ready, unexecuted** | Block A adapted to export-leak reality | Paste Block C, then Block D into Claude Code |
| `docs/session-state-2026-06-10-security-audit.md` | In docs/, untracked-then-committed, NOT archived | STATUS.md cross-verification table added | Archive only after C-items close |
| HOUZi24 canned messages (3 HTML sheets in project knowledge: Sheet1, Sheet3, HOUZi24_Canned_Messages, TASK_LIST) | NOT ingested — blocked | Categorized: 1 Register, 2 Deposit (+ "Binance should be added" TODO), 3 Withdraw, 4–8 lottery Q's **with no canned answers yet** | (a) multilingual index, (b) complete missing answers 4–8 from client, (c) ingest into OKBET tenant |
| Production deploy | **LIVE**: web https://autocsr.vercel.app (Vercel), inference https://inference-production-e5c4.up.railway.app (Railway) | CI→Vercel→Railway pipeline all green, commits `9ff0571`…`b3ae7cb` | 6 post-deploy TODOs (§10) |

## 5. Decisions Made and Rationale

1. **Docs-first, then security, then features** — drift was causing re-fixing of closed issues
   and trust erosion. Forecloses: ad-hoc status notes anywhere but STATUS.md.
2. **ADR 0002 Option B: arbitrary-hex canonical for pilot** — no test suite, launch pending;
   586-occurrence refactor unjustifiable. Forecloses @theme utility classes until post-pilot.
3. **text-sub = #606075** (code majority ×151); #9898b0 demoted to text-sub-bright; BRAND.md was
   the outlier.
4. **Shadcn dark fix via `:root` remap, no `.dark` class** — product is dark-only; foreground
   companion vars verified (#ffffff on primary/destructive, #e8e8f0 elsewhere).
5. **HOUZi24 ingests into the OKBET tenant** (user confirmed brand relationship) — no new DAA,
   no new tenant row. Forecloses treating it as multi-tenant test case.
6. **No Bengali ingest before multilingual embeddings** — English-only bge would silently break
   retrieval (0.72 min_score misses or garbage) and semantic-cache clustering (0.92).
7. **C1: rotation yes, history scrub no** — files never tracked; scrub command removed from
   STATUS.md. All 11 credentials rotated, owner-confirmed 2026-06-11.
8. **Reviews are inputs to STATUS.md, never to-do lists** — every external finding gets a
   claim/verified-against-live-repo table row before action.
9. Abandoned without pursuit: Claude's design-audit recommendation to canonize @theme tokens now
   (rejected, see #2); per-result re-embedding via translation layer (last-resort only).

## 6. Problem Solving and Reasoning Trail

- **Stale-review trap:** Codex doc looked like open work; timestamp reconciliation showed 7 items
  already closed. Resolution: the cross-check table pattern now lives in STATUS.md.
- **C1 forensics:** audit claimed committed secrets; `git ls-files` + `git log --all
  --diff-filter=A` proved never-tracked. Real vector was repomix bundling. Dead end avoided:
  running `git filter-repo` (would have rewritten history for nothing). Preventive:
  `.gitignore` + `.repomixignore` entries for `_env.*` / `client_secret*.json`.
- **Foreground-var gap:** shadcn remap table only covered surface vars; flagged the six
  `*-foreground` companions before commit — they were verified/corrected (white-on-indigo,
  light-on-dark pairs) preventing invisible-text regressions.
- **Vercel deploy chain (4 stacked root causes):** secret typo `VERCEL_TOEKN` → project didn't
  exist → turbopack workspace-root break (CLI must run from repo root) → missing Prisma client
  (`build: prisma generate && next build`). Each masked the next.
- **Railway:** fictional requirements pins + undeclared PyJWT → rewritten from pyenv; service
  renamed web→inference to match workflow; DB startup assertion (from Block A) confirmed working
  in production boot logs.
- **dotenv-cli status conflict:** uploaded CLAUDE.md says dotenv-cli BROKEN (Python 3.11 Homebrew
  removal) and gives workarounds; older memory says it's the permanent fix. Trust the repo
  CLAUDE.md (newer). Inference must still be started with `set -a && source .env && set +a`
  (shell DATABASE_URL leak).

## 7. Voice Calibration Corrections

- "Provide prompts to generate all documentations" → corrected to: more documents worsen drift;
  consolidate into a hierarchy with authority rules instead. User accepted.
- Claude Code's own recommendation (canonize tokens) → overridden with senior-dev judgment
  (no regression net, launch pending). Pattern user wants: challenge the tool's recommendation
  when risk-context says otherwise.
- Standing register: brutal honesty, no hand-holding, senior architect + chief UI/UX lens,
  copy-paste-ready blocks with validation steps. No corrections to this register occurred.

## 8. All User Messages

1. Provided 3 HTML canned-message files ("agent response on live chat… based on the category of
   support"); said repo is in project knowledge; asked to read
   session-state-2026-06-10-security-audit.md; "tell me what we should do next and this data
   dont you think we have to add."
2. Pasted Codex full-repo review; "as a senior developer how we proceesed this al;so see the new
   review and plan how we mitigate over mentioned problem and everything" + invoked
   /operations:process-optimization /operations:risk-assessment /honest
   /operations:vendor-review /engineering:documentation.
3. (Elicitation answers) HOUZi24 = OKBET brand under existing DAA; secrets "some rotated";
   deliverable = "Both — ledger first, then fix prompts."
4. "so to start what should i tell to claude"
5. "then we do one thing first solve multi-doc drift problem and then we start this development
   — i want you to provide me a /design:design-system /engineering:documentation prompts so that
   we can generate all documentations and then start this implimentations"
6. (3 screenshots of Phase-1 design audit) "check this and help me what should i tell claude for
   next before phase 2 and prompt 2"
7. (Screenshot of shadcn remap table + completion summary) "check"
8. "what should i tell her" (→ wanted the paste-ready foreground-vars message)
9. (Claude Code report: audit file found in docs/, C1 doesn't reproduce in git, repomix was the
   vector) "what should i tell claude"
10. (This message) Uploaded updated CLAUDE.md/STATUS.md/ADRs + deploy-session summary; requested
    this handoff file; emphasized the 3 HTML canned-message files must be incorporated "in a way
    that after start new chat conversation then automatically you can provide me the best prompt
    for claude code to do the rest of the task"; announced starting with **Claude Cowork** (new
    to it, wants best onboarding); invoked /operations:process-optimization /brutal /cowork
    /senior dev.

## 9. Open Questions and Unresolved Ambiguities

- **Does Upstash offer bge-m3 (multilingual) as a built-in index model?** Unverified. Determines
  cheap path (new index AUTOCSR-AI-V3) vs external-embedding refactor for Bengali ingest.
- **Does the OKBET DAA impose at-rest/PII obligations** that change extension vault design
  (H4) and anonymizer scope (M1)? The agreement PDF is in project knowledge but was never read
  this session.
- **HOUZi24 canned answers 4–8 missing** (ticket purchase, number choice, viewing purchases, win
  notification, post-win withdrawal) + "Binance should be added" TODO on deposit. Client must
  supply before ingest, or KB ships incomplete.
- **H2 auditor async / H4–H5 extension claims** — CLAUDE.md says fixed, audit disputed; never
  settled by code read.
- **Polar MoR tax treatment** for US-entity/Dhaka-operator/SEA-customers — flagged, not resolved.
- Whether QStash cron should point to Railway permanently or stay ngrok for dev (related TODO #4).

## 10. Pending Tasks

In order requested / discovered:

1. **HIGH (runtime-crashing):** set `OPENAI_API_KEY` + `ANTHROPIC_API_KEY` on Railway inference
   service — boots fine (lazy clients), every agent/judge call crashes without them.
   `railway variable set OPENAI_API_KEY=<key> ANTHROPIC_API_KEY=<key> --project eabb3346-5f19-44d6-ac9b-6108fb276ad1 --environment production --service inference`
2. Google console: add redirect URI `https://autocsr.vercel.app/api/auth/callback/google`.
3. Polar webhook endpoint URL → production value.
4. QStash cron destination ngrok:8000 → Railway domain (`bun run cron:register` after TRIGGER_URL update).
5. Rotate `VERCEL_TOKEN` (was pasted in a chat).
6. **Block C** — C3 injection guard + C4 word-boundary scope filter (prompt ready in
   SECURITY-REMEDIATION-BLOCKS.md from this conversation; re-generate if lost).
7. **Block D** — C5 cache write-gating (prompt ready, same file).
8. Block B (per-tenant inference auth), Block E (rate-limit/quota H1), Block F-audit (auditor
   async H2 — verify first, may be done), Block G (extension H4/H5), Block H (M1–M3).
9. Multilingual embedding decision + index migration → then HOUZi24 canned-message ingest into
   OKBET tenant via knowledge pipeline (upload→chunk→embed→retrieve).
10. Backlog (STATUS.md): Dependabot ×24, `stripeCustomerId` rename, prefers-reduced-motion,
    badge radius, inert `dark:` classes, post-pilot token migration.

## 11. Current Work

Immediately before this handoff: reviewing the production-deploy session results (Vercel web
LIVE, Railway inference LIVE, CI green end-to-end) and the updated STATUS.md/CLAUDE.md/ADRs the
user uploaded. Last concrete action in-conversation: drafting the paste-ready Claude Code message
that closed C1 as EXPOSED-VIA-EXPORT, shipped `.gitignore`/`.repomixignore` excludes + DB startup
assertion, and queued Block C as the next session. The deploy session then happened in Claude
Code (outside this chat) and its results are reflected in the uploaded STATUS.md.

## 12. Optional Next Step

Anchored to the user's latest message ("provide me the best prompt for claude code to do the
rest of the task" + "we wil start work with claude cowork"):

**Next session sequence:**
1. Knock out runtime TODOs 1–5 (keys on Railway first — production is silently broken without
   them; 15 minutes total, no Claude Code needed for #1–3/#5).
2. Paste **Block C** into Claude Code/Cowork (injection guard + scope filter — full prompt in
   SECURITY-REMEDIATION-BLOCKS.md; ask the new chat to re-emit it if the file is lost).
3. Then **Block D** (cache write-gating).
4. Then ask the new chat for the **multilingual-index migration prompt** (check Upstash bge-m3
   availability first) — this unblocks the HOUZi24 canned-message ingest, which is the original
   goal of message #1 of this session.

**Claude Cowork onboarding (user is new):** Cowork is the agentic desktop app for non-developers,
but it drives the same Claude agent — the repo's CLAUDE.md, skills, and Document Authority
hierarchy apply unchanged. Treat each Cowork task like a Claude Code block: one block per
session, paste the prompt, demand the validation commands' output before accepting "done", and
require STATUS.md updated first per ADR 0001. Start Cowork on a LOW-risk task (e.g. TODO
backlog items) before trusting it with security blocks.
