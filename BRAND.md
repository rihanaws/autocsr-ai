# AutoCSR — Brand Vision & Design Guidelines
**Version:** 1.0 | **Owner:** TechSci, Inc. | **Effective:** June 2026

---

## Brand Vision

AutoCSR exists at the intersection of operational intelligence and zero-tolerance reliability.
We are not a chatbot. We are infrastructure.

**One sentence:** *The AI backbone that betting operators trust to handle every customer conversation — instantly, accurately, 24/7.*

**Positioning:** Enterprise AI infrastructure for regulated iGaming operators. We speak to COOs, VP Ops, and Technical Directors — not developers or end consumers. Our value is measured in cost-per-resolution and uptime percentage, not clever features.

---

## Brand Personality

| Trait | What It Means in Practice |
|-------|--------------------------|
| **Precise** | Every word earns its place. No filler. No vague promises. |
| **Authoritative** | We've already solved this problem. We're showing you the result. |
| **Operator-grade** | We think in SLAs, throughput, and error rates. Not "awesome AI". |
| **Quietly confident** | The numbers speak. We don't need to shout. |

**Tone:** Bloomberg Terminal meets Vercel dashboard. Direct, metric-forward, zero startup energy.

**Anti-patterns to avoid:**
- ❌ "Revolutionary AI that transforms your business"
- ❌ Emojis in product copy
- ❌ Vague social proof ("thousands of users")
- ❌ Consumer-friendly cheerfulness ("Let's go!")
- ✅ "61% cost reduction. Measured across 4,821 live sessions."
- ✅ Specific numbers. Named clients. Verifiable claims.

---

## Typography System

### Primary Stack

| Role | Font | Weight | Use Case |
|------|------|--------|----------|
| **Display** | Geist (by Vercel) | 700–800 | Hero headlines, section titles, large numbers |
| **Body** | Inter | 400–500 | All paragraph text, UI labels, descriptions |
| **Mono** | JetBrains Mono | 400–500 | Numbers, IDs, API keys, timestamps, badges, code |

### Why This Stack

**Geist** — Vercel's own typeface, purpose-built for technical products. Clean geometric grotesque
with excellent legibility at both display and small sizes. Signals "infrastructure" rather than
"startup". Available via `next/font/local` using `geist` npm package.

**Inter** — The Notion standard. Universally readable at UI sizes. Designed for screen rendering
with exceptional spacing at 13–15px. The universal signal for "serious product".

**JetBrains Mono** — Non-negotiable for anything numerical. Tabular figures prevent number jitter
in live counters and dashboards. Every stat, metric, ID, and timestamp must use this.

### Scale & Sizing

```css
/* Display scale */
--text-hero:     clamp(48px, 7vw, 80px);   /* hero h1 */
--text-display:  clamp(32px, 4vw, 48px);   /* section h2 */
--text-title:    24px;                      /* card titles */
--text-heading:  18px;                      /* sub-sections */

/* Body scale */
--text-lg:    17px;   /* lead paragraph */
--text-base:  15px;   /* body copy */
--text-sm:    13px;   /* secondary text */
--text-xs:    11px;   /* labels, captions */
--text-2xs:   10px;   /* badges, timestamps */

/* Mono scale (numbers/data) */
--text-mono-xl:  28px;   /* dashboard KPI numbers */
--text-mono-lg:  20px;   /* chart labels */
--text-mono-sm:  12px;   /* table cells, IDs */
--text-mono-xs:  10px;   /* badges */
```

### Letter Spacing Rules

- Display headlines: `-0.03em` to `-0.04em` (tight)
- Body text: `0` (normal)
- Mono/uppercase labels: `0.06em` to `0.12em` (expanded)
- Uppercase tracking badges: `0.08em`

---

## Color System

### Base Palette

```
Background Layers (dark — deepest to lightest):
  bg-void:      #060608   ← page background (deepest)
  bg-base:      #090910   ← main content background
  bg-surface:   #0f0f18   ← cards, panels
  bg-surface-2: #141420   ← elevated panels, modals
  bg-surface-3: #1a1a28   ← hover states, active rows

Borders:
  border:       rgba(255,255,255,0.06)   ← default
  border-mid:   rgba(255,255,255,0.10)   ← hover, focus
  border-strong: rgba(255,255,255,0.16)  ← separators

Text Hierarchy:
  text-primary: #e8e8f0   ← primary content
  text-sub:     #9898b0   ← secondary/supporting
  text-dim:     #606075   ← tertiary/muted
  text-ghost:   #30303f   ← placeholder, disabled

Accent (Indigo):
  accent:           #4f46e5   ← primary CTA, active state
  accent-mid:       #6366f1   ← secondary accent
  accent-glow:      rgba(79,70,229,0.12)
  accent-border:    rgba(79,70,229,0.25)
  accent-hover:     #4338ca

Status Colors:
  green:  #22c55e   ← success, resolved, promoted
  amber:  #f59e0b   ← warning, pending
  red:    #ef4444   ← error, flagged, rejected
  blue:   #3b82f6   ← info, cache hit
```

### Usage Rules

1. **Never use Tailwind's default color-* classes** for product surfaces. Always use exact hex values from the token system above.
2. **Green is reserved for positive metrics** — resolution rate, promotion, success. Don't use it for decorative purposes.
3. **Red signals action required** — flagged responses, errors, rejected runs. Never use for neutral differentiation.
4. **The accent (indigo) is the single CTA color.** One primary action per view. Never two competing indigo elements.
5. **All dark surfaces must pass WCAG AA** against #e8e8f0 text (minimum 4.5:1 contrast ratio).

---

## Logo & Mark

**Wordmark:** AUTOCSR — set in Geist 700, letter-spacing -0.03em, #e8e8f0

**Mark concept:** A simplified multi-agent routing diagram — five nodes converging to a single hub. Clean, geometric, monochrome. Works at 16px favicon and 200px logo.

**Clear space:** Minimum 1× cap-height around the mark on all sides.

**Forbidden uses:**
- No color inversions to light backgrounds (product is dark-native)
- No rounded rectangle containers around the wordmark
- No shadow or glow effects on the wordmark

---

## Layout Principles

### Grid
- Max-width: `1280px` (7xl)
- Page gutters: `24px` (mobile) → `40px` (tablet) → `64px` (desktop)
- Section vertical rhythm: `96px–128px` between major sections
- Card inner padding: `24px` (default) / `16px` (compact)

### Spacing Scale
```
4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px, 128px
```

### Borders & Radius
- Card radius: `8px` (`rounded-lg`)
- Button radius: `6px` (`rounded-md`)
- Badge radius: `4px` (`rounded`)
- Input radius: `6px`
- **No radius > 12px in the product.** Rounded-full only for avatar circles.

### Elevation (simulated via border + bg)
```
Level 0 — bg-base:    no border visible
Level 1 — bg-surface: border rgba(255,255,255,0.06)
Level 2 — bg-surface-2: border rgba(255,255,255,0.10)
Level 3 — modal/overlay: border rgba(255,255,255,0.14) + backdrop-blur-sm
```
No drop shadows in the product. Elevation is communicated through border opacity, not box-shadow.

---

## Component Patterns

### Buttons

```
Primary (CTA):
  bg: #4f46e5  →  hover: #4338ca
  text: white
  border: none
  use for: single primary action per page

Secondary:
  bg: rgba(79,70,229,0.08)
  border: rgba(79,70,229,0.20)
  text: #a5a0ff
  use for: secondary confirmations

Ghost:
  bg: transparent
  border: rgba(255,255,255,0.08)
  text: #9898b0  →  hover: #e8e8f0
  use for: tertiary actions, cancel

Destructive:
  bg: rgba(239,68,68,0.08)
  border: rgba(239,68,68,0.20)
  text: #f87171
  use for: delete, reject, danger
```

### Status Badges
All badges: `font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded`

```
ACTIVE / PROMOTED / RESOLVED  →  green
PENDING / QUEUED              →  amber
REJECTED / FAILED / FLAGGED   →  red
CACHE HIT                     →  blue
FREE / STARTER                →  dim (rgba(255,255,255,0.06) bg)
```

### Data Display Rules
- **Every number, timestamp, ID, metric → font-mono, no exceptions**
- Tables: `text-[12px] font-mono` for data cells
- KPI cards: `text-[28-40px] font-mono font-semibold tabular-nums`
- Percentage values: always show one decimal place (e.g., `61.3%`)
- Timestamps: ISO-ish, short (e.g., `Jun 8, 2026 · 14:32`)

---

## Voice & Copy Guidelines

### Headlines
- Max 6 words for hero headline
- Lead with the outcome, not the feature
- Present tense, active voice
- ✅ "61% cost reduction. Day one."
- ❌ "Our AI can help you reduce costs significantly"

### Body Copy
- One idea per sentence
- Max 2 sentences per paragraph in marketing copy
- Always follow a claim with its proof: "61% cost reduction — measured across OKBET's first 30 days"
- Spell out what happens, don't hedge with "can" or "may"

### Metric Formatting
- Always real-looking, specific: `4,821` not `5,000`
- Source attribution where possible: "across OKBET live sessions"
- Unit always adjacent: `94ms avg` not `avg 94 ms`

### CTA Copy
- Primary: "Start Free Pilot" (not "Get Started", not "Sign Up")
- Secondary: "See live demo →" (arrow, not button)
- Footer CTA: "Request access" (enterprise tone)

---

## Marketing Narrative Arc

```
Hook:     "21 agents. One AI."
Problem:  Your CSR team handles the same 8 deposit questions 400x a day.
          Each answer costs you $2.80 in agent time. At 10K queries/month,
          that's $28,000 in salary for questions a machine already knows.
Solution: AutoCSR resolves 61% of queries instantly from cache — zero LLM cost.
          The other 39% hit specialized agents trained on your exact platform.
Proof:    4,821 queries resolved today. 94ms average. OKBET live.
CTA:      Start your free 30-day pilot.
```

---

## Competitive Differentiation

| Competitor | Position | Our Counter |
|------------|----------|-------------|
| Intercom Fin | Generic AI chat | "Betting-specific. 5 specialized agents, not one generic bot." |
| Zendesk AI | Enterprise legacy | "Deploys in 30 days, not 6 months. No enterprise procurement." |
| Custom LLM builds | DIY | "Operating in production day one. LoRA fine-tuning included." |
| Human CSR teams | Status quo | "61% of your tickets are identical. We handle those. Your team handles the rest." |

---

*AutoCSR Brand Guidelines v1.0 · TechSci, Inc. · June 2026*
*Next review: December 2026 or at 10K MRR milestone*
