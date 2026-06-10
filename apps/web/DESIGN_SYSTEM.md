# AutoCSR Design System — Canonical Reference

> **This file supersedes all visual/token guidance in CLAUDE.md and BRAND.md. If they conflict, this file wins.**
>
> Legal hex values are defined ONLY in this file. If a hex is not in this file, do not use it.
> Token strategy: arbitrary-value classes (`bg-[#0f0f18]`) are the canonical pattern for the pilot phase — see [ADR 0002](../../docs/decisions/0002-arbitrary-hex-canonical.md) and the "Future: token migration" section at the bottom.

---

## 1. Typography

Three fonts, loaded once in `app/layout.tsx` via next/font CSS variables. No other font may be loaded or referenced.

| Role | Font | Weights | CSS variable | Utility class | Use |
|------|------|---------|--------------|---------------|-----|
| Display | Geist (geist npm pkg) | 700–800 | `--font-display` (aliases `--font-geist-sans`) | `font-display` | Hero headlines, section/page titles, logo wordmark |
| Body | Inter (next/font/google) | 400–500 | `--font-body` (aliases `--font-inter`) | `font-body` (default on `<body>`) | All paragraph text, labels, descriptions, nav |
| Mono | JetBrains Mono (next/font/google) | 400–600 | `--font-mono` (aliases `--font-jetbrains-mono`) | `font-mono` | **ALL numbers, percentages, timestamps, IDs, API keys, agent names, status values, scores, table data. If it's a data value, it's mono. No exceptions.** |

Emails (`emails/*.tsx`): email clients cannot load webfonts — use inline `fontFamily: "Inter, Arial, sans-serif"` only.

### Scale

```
Display:  --text-hero clamp(48px,7vw,80px) | --text-display clamp(32px,4vw,48px) | title 24px | heading 18px
Body:     lg 17px | base 15px | sm 13px | xs 11px | 2xs 10px       (line-height 1.5–1.6)
Mono:     xl 28px | lg 20px | sm 12px | xs 10px                     (line-height 1.2, tabular-nums for counters)
```

### Letter spacing

Display headlines `-0.03em` to `-0.04em` · body `0` · mono/uppercase labels `0.06em`–`0.12em` · uppercase badges `0.08em`.

---

## 2. Color Palette (canonical hex values)

Use via arbitrary classes (`bg-[#0f0f18]`, `text-[#606075]`, `border-[rgba(255,255,255,0.06)]`) or inline `style` for Recharts/email. Never Tailwind `color-*` classes for product surfaces.

### Backgrounds (deepest → lightest)

| Name | Hex | Usage |
|------|-----|-------|
| bg-void | `#060608` | Page background, deepest layer (marketing hero) |
| bg-base | `#090910` | Main content background, `<body>` default |
| bg-surface | `#0f0f18` | Cards, panels, sidebar, topbar |
| bg-surface-2 | `#141420` | Elevated panels, modals, dropdowns, nested cards |
| bg-surface-3 | `#1a1a28` | Hover states, active rows, deep nesting |
| row-hover | `rgba(255,255,255,0.02)` | Table row hover background |

### Borders

| Name | Value | Usage |
|------|-------|-------|
| border | `rgba(255,255,255,0.06)` | Default for ALL borders |
| border-strong | `rgba(255,255,255,0.12)` | Emphasis, active, separators, inputs |

### Text

| Name | Hex | Usage |
|------|-----|-------|
| text-primary | `#e8e8f0` | Headings, body content, important values |
| text-sub | `#606075` | Labels, secondary/supporting text (canonical — code majority; BRAND.md's `#9898b0` for this role is wrong) |
| text-sub-bright | `#9898b0` | Optional brighter secondary — use sparingly when `#606075` fails contrast on surface-3 |
| text-dim | `#30303f` | Muted, placeholder, disabled |
| text-on-accent | `#ffffff` | Text on accent-filled buttons ONLY |

### Accent (indigo — the single CTA color, one primary action per view)

| Name | Value | Usage |
|------|-------|-------|
| accent | `#4f46e5` | Primary CTA, active nav, focus ring |
| accent-hover | `#4338ca` | Hover state of accent fills |
| accent-mid | `#6366f1` | Secondary accent (charts, gradients) |
| accent-glow | `rgba(79,70,229,0.12)` | Active/info backgrounds |
| accent-border | `rgba(79,70,229,0.25)` | Active card borders |
| accent-text | `#a5a0ff` | Text on translucent indigo (secondary buttons, info badges) |

### Status (fill + bright-text pairs — fills for solid elements/charts, bright text on translucent bg)

| Status | Fill | Text-on-tint | Tint bg | Tint border |
|--------|------|--------------|---------|-------------|
| success / online / promoted | `#22c55e` | `#4ade80` | `rgba(34,197,94,0.1)` | `rgba(34,197,94,0.18)` |
| warning / pending / degraded | `#f59e0b` | `#fbbf24` | `rgba(245,158,11,0.1)` | `rgba(245,158,11,0.18)` |
| error / flagged / rejected | `#ef4444` | `#f87171` | `rgba(239,68,68,0.1)` | `rgba(239,68,68,0.18)` |
| info / cache hit | `#3b82f6` | `#60a5fa` | `rgba(59,130,246,0.1)` | `rgba(59,130,246,0.18)` |

### Agent tag colors

| Agent | Text | Bg |
|-------|------|----|
| deposit | `#4ade80` | `rgba(34,197,94,0.1)` |
| withdrawal | `#fbbf24` | `rgba(245,158,11,0.1)` |
| verification | `#c084fc` | `rgba(168,85,247,0.1)` |
| onboarding | `#60a5fa` | `rgba(59,130,246,0.1)` |
| general | `#9ca3af` | `rgba(100,100,120,0.15)` |

### Usage rules

1. Green reserved for positive metrics. Red signals action required. Never decorative.
2. All text on dark surfaces must pass WCAG AA (4.5:1) — `text-dim` is decorative-only, never for readable content.
3. Indigo accent appears once per view as the primary action.

---

## 3. Spacing, Radius, Elevation

**Spacing scale:** `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128` (px)
Max content width `1280px` · gutters 24/40/64px (mobile/tablet/desktop) · section rhythm 96–128px · card padding 24px (16px compact).

**Radius:** card `8px` (rounded-lg) · button/input `6px` (rounded-md) · badge `4px` (rounded) · **nothing above 12px**; `rounded-full` for avatar circles only.
Known deviation: `components/ui/badge.tsx` uses `rounded-4xl` pill shape (Base UI scaffold default) — exceeds the 12px cap; scheduled for the post-pilot fix pass, do not copy the pattern.

**Elevation — borders, never drop shadows:**

```
Level 0  bg-base       no visible border
Level 1  bg-surface    border rgba(255,255,255,0.06)
Level 2  bg-surface-2  border rgba(255,255,255,0.10–0.12)
Level 3  modal/overlay border rgba(255,255,255,0.14) + backdrop-blur-sm
```

---

## 4. Motion

Stack lists Motion (`motion/react`) but no component currently imports it — CSS transitions are the de facto standard:

- `duration-100` — micro-interactions: hover color/bg changes
- `duration-150` — standard transitions: panels, buttons, reveals
- Easing: default Tailwind ease (`ease-in-out` where explicit)
- No idle/looping animation on dashboard surfaces
- `prefers-reduced-motion` not yet implemented — required before any `motion/react` usage lands

---

## 5. Component Reference (components/ui/ — Base UI + cva, dark via remapped `:root` vars)

Semantic vars (`--primary`, `--accent`, …) in `app/globals.css` are remapped to this palette, so these primitives render dark without a `.dark` class. `dark:` variant classes inside them are inert (no `.dark` ancestor) — leftover scaffold, do not extend.

### Button (`ui/button.tsx`, `@base-ui/react/button`)
- **Variants:** `default` (accent fill, white text, hover /80) · `outline` (border + bg-background, hover bg-muted) · `secondary` (surface-2 fill) · `ghost` (transparent, hover bg-muted) · `destructive` (red /10 tint, red text, hover /20) · `link` (accent text, underline on hover)
- **Sizes:** `xs` h-6 · `sm` h-7 · `default` h-8 · `lg` h-9 · `icon`/`icon-xs`/`icon-sm`/`icon-lg` square
- **States:** focus-visible ring (`ring-3 ring-ring/50`) · active translate-y-px · disabled opacity-50 + pointer-events-none · `aria-invalid` red border/ring
- **ARIA:** native button semantics via Base UI; `aria-haspopup` aware (skips press animation)

### Badge (`ui/badge.tsx`)
- **Variants:** `default` (accent fill) · `secondary` · `destructive` (red tint) · `outline` · `ghost` · `link`
- Status badges pattern: `font-mono text-[10px] tracking-widest uppercase px-2 py-0.5` + status tint combos from §2.
- **States:** focus-visible ring, `aria-invalid` red ring. Renders `<span>` by default, polymorphic via `render`.

### Dialog (`ui/dialog.tsx`, `@base-ui/react/dialog`)
- Popup on `bg-popover` (#141420), close X button (ui Button), backdrop overlay.
- **ARIA:** `role="dialog"`, `aria-modal`, focus trap, Esc to close — provided by Base UI.

### DropdownMenu (`ui/dropdown-menu.tsx`, `@base-ui/react/menu`)
- Items highlight with `bg-accent` (#1a1a28), destructive items red, checkbox/submenu items (Check/ChevronRight icons).
- **ARIA:** `role="menu"`/`menuitem"`, full keyboard navigation (arrows, Home/End, typeahead) — Base UI.

### Select (`ui/select.tsx`, `@base-ui/react/select`)
- Trigger with `border-input`, popup on `bg-popover`, item highlight `bg-accent`, check indicator.
- **ARIA:** `role="combobox"`/`listbox"`, keyboard selection — Base UI.

### Accordion (`ui/accordion.tsx`, `@base-ui/react/accordion`)
- Trigger with chevron, focus ring, `text-muted-foreground` body.
- **ARIA:** `aria-expanded`, region semantics, arrow-key navigation — Base UI.

### Textarea (`ui/textarea.tsx`)
- Plain styled `<textarea>`: `border-input`, focus `ring-ring`, placeholder `text-muted-foreground`, disabled opacity.

### Shared data-display patterns

```
Card:          bg-[#0f0f18] border border-[rgba(255,255,255,0.06)] rounded-lg
Table header:  text-[#606075] text-[10px] uppercase tracking-[0.08em] font-mono
Table row:     border-b border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.02)]
KPI value:     font-mono text-[28px] font-semibold tabular-nums text-[#e8e8f0]
KPI label:     text-[10px] text-[#606075] uppercase tracking-[0.03em]
Percentages:   always one decimal (61.3%) · units adjacent (94ms avg)
Recharts:      grid stroke rgba(255,255,255,0.04) · ticks fill rgba(255,255,255,0.2)
               fontSize 10 JetBrains Mono · tooltip bg #141420 border rgba(255,255,255,0.1) radius 6
```

Extension code (`packages/extension`): ARIA + data-attributes only, never CSS class selectors.

---

## 6. Removed / Never Use

| Banned | Replacement | Why |
|--------|-------------|-----|
| **Syne** (font) | Geist via `font-display` | Deprecated June 2026 font migration |
| **DM Sans** (font) | Inter via `font-body` (web) / `Inter, Arial, sans-serif` (email) | Deprecated June 2026 font migration |
| `#080810` | `#060608` (bg-void) | Off-palette near-void |
| `#0a0a14` | `#090910` (bg-base) | Off-palette near-base |
| `#0a0a13` | `#090910` (bg-base) | Off-palette near-base |
| `#111119` | `#0f0f18` (bg-surface) | Off-palette near-surface |
| `#14140a` | `#141420` (bg-surface-2) | Typo — transposed digits |
| `#0a100a` | `#090910` (bg-base) | Typo — green-shifted |
| `#c0c0d0` | `#9898b0` (text-sub-bright) | Off-palette light gray |
| `#818cf8` | `#6366f1` (accent-mid) or `#a5a0ff` (accent-text) | Off-palette indigo |
| Tailwind `color-*` classes (e.g. `bg-gray-800`) | Exact hex from §2 | Brand palette only |
| Drop shadows (`shadow-*`) on product surfaces | Border-based elevation (§3) | No-drop-shadows rule |
| Radius > 12px | ≤ 12px per §3 | Brand geometry |

**Exemption:** Google OAuth logo hexes `#4285f4 #ea4335 #fbbc05 #34a853` in `app/(auth)/login` and `app/(auth)/signup` are a third-party brand requirement — allowed there only.

---

## 7. Future: token migration (post-pilot)

Intended direction: promote §2 palette into `@theme` tokens with readable names (`--color-surface`, `--color-text-sub`, …) and migrate arbitrary-hex classes (`bg-[#0f0f18]` → `bg-surface`) across the ~30 affected files. Deferred per ADR 0002 (no test suite, launch pending). Until then, arbitrary hex from this file is canonical; do NOT add new `@theme` color tokens piecemeal.

---

## 8. Current violators (fix in post-pilot cleanup session)

Files containing Never-Use hex values (§6):

- `app/(dashboard)/cache/page.tsx`
- `app/(dashboard)/training/page.tsx`
- `app/(dashboard)/knowledge/page.tsx`
- `components/dashboard/cache-controls.tsx`
- `components/dashboard/profile-form.tsx`
- `components/dashboard/totp-setup.tsx`
- `components/dashboard/settings-client.tsx`
- `components/dashboard/knowledge-client.tsx`
- `components/dashboard/settings-tabs.tsx`
- `components/dashboard/knowledge/upload-dialog.tsx`
- `components/marketing/trust-section.tsx`
- `components/marketing/social-proof-section.tsx`
- `components/marketing/problem-section.tsx`

Other known deviations: `ui/badge.tsx` radius cap (§3) · inert `dark:` classes in `ui/*` (§5) · `prefers-reduced-motion` missing (§4).
