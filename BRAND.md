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

## Visual System

All visual tokens and component rules — typography, color palette, spacing, radii, elevation, motion, and component patterns — are defined in **`apps/web/DESIGN_SYSTEM.md`**, the single source of truth. If anything in this document conflicts with it, DESIGN_SYSTEM.md wins.

Canonical stack (names only): Geist (display) · Inter (body) · JetBrains Mono (all data values).

---

## Logo & Mark

**Wordmark:** AUTOCSR — set in Geist 700, letter-spacing -0.03em, text-primary token (see DESIGN_SYSTEM.md)

**Mark concept:** A simplified multi-agent routing diagram — five nodes converging to a single hub. Clean, geometric, monochrome. Works at 16px favicon and 200px logo.

**Clear space:** Minimum 1× cap-height around the mark on all sides.

**Forbidden uses:**
- No color inversions to light backgrounds (product is dark-native)
- No rounded rectangle containers around the wordmark
- No shadow or glow effects on the wordmark

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
