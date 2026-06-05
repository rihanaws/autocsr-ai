# AutoCSR Design System

## Font Loading
Root layout (apps/web/app/layout.tsx) uses next/font/google with CSS variables.
Fonts are already loaded globally — no <link> tags needed.

Variables available everywhere:
- var(--font-display) → Syne 700
- var(--font-body)    → DM Sans
- var(--font-mono)    → JetBrains Mono

## Font Usage Rules (non-negotiable)
- Syne 700: headings (h1, h2), logo, page titles, section titles → className="font-display"
- DM Sans 400/500: all body text, labels, descriptions, nav items → className="font-body"
- JetBrains Mono 400/600: ALL numbers, ALL percentages, ALL timestamps,
  ALL agent names, ALL status values, ALL API keys, ALL response times,
  ALL query counts, ALL scores. If it's a data value, it's mono. → className="font-mono"

## Color Tokens
bg-base: #090910           ← page background, never use pure black
bg-surface: #0f0f18        ← sidebar, topbar, cards
bg-surface-2: #141420      ← hover, nested cards, dropdowns
bg-surface-3: #1a1a28      ← deep nesting only
border: rgba(255,255,255,0.06)        ← default ALL borders
border-strong: rgba(255,255,255,0.12) ← emphasis, active
text-primary: #e8e8f0      ← headings, important values
text-sub: #606075          ← labels, secondary text
text-dim: #30303f          ← muted, disabled
accent: #4f46e5            ← CTAs, active nav, focus
accent-glow: rgba(79,70,229,0.12)     ← active backgrounds
accent-border: rgba(79,70,229,0.25)   ← active card borders

## Status Colors (always use these exact combos)
online:   bg rgba(34,197,94,0.1)   text #4ade80  border rgba(34,197,94,0.18)
degraded: bg rgba(245,158,11,0.1)  text #fbbf24  border rgba(245,158,11,0.18)
error:    bg rgba(239,68,68,0.1)   text #f87171  border rgba(239,68,68,0.18)
info:     bg rgba(79,70,229,0.12)  text #a5a0ff  border rgba(79,70,229,0.25)

## Agent Tag Colors
deposit:      green   rgba(34,197,94,0.1)    #4ade80
withdrawal:   amber   rgba(245,158,11,0.1)   #fbbf24
verification: purple  rgba(168,85,247,0.1)   #c084fc
onboarding:   blue    rgba(59,130,246,0.1)   #60a5fa
general:      gray    rgba(100,100,120,0.15) #9ca3af

## Component Patterns
Card: bg-[#0f0f18] border border-[rgba(255,255,255,0.06)] rounded-lg
Table header: text-[#606075] text-[10px] uppercase tracking-[0.08em] font-mono
Table row: border-b border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.02)]
KPI value: font-mono text-[20px] font-semibold tracking-tight text-[#e8e8f0]
KPI label: text-[9.5px] text-[#606075] tracking-[0.03em] uppercase

## Recharts Config (apply to ALL charts)
CartesianGrid: stroke="rgba(255,255,255,0.04)" strokeDasharray="0"
XAxis/YAxis tick: fill rgba(255,255,255,0.2), fontSize 10, fontFamily JetBrains Mono
Tooltip: bg #141420, border rgba(255,255,255,0.1), radius 6, fontFamily JetBrains Mono
