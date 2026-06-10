# AutoCSR Design System — Skill Pointer

**Authority: `apps/web/DESIGN_SYSTEM.md`. Read it before writing or modifying ANY UI component. If this file or any other doc conflicts with it, DESIGN_SYSTEM.md wins.**

## Quick rules (summary only — full detail in DESIGN_SYSTEM.md)

### Fonts (three, no others)
- `font-display` → Geist 700 — headings, page/section titles, logo
- `font-body` → Inter 400/500 — all body text, labels, nav (default on `<body>`)
- `font-mono` → JetBrains Mono — **ALL numbers, percentages, timestamps, IDs, agent names, status values. If it's a data value, it's mono.**
- NEVER: Syne, DM Sans (deprecated June 2026). Emails: `Inter, Arial, sans-serif` inline.

### Colors
Use arbitrary classes with exact hex from DESIGN_SYSTEM.md §2 only:

```
bg:     void #060608 · base #090910 · surface #0f0f18 · surface-2 #141420 · surface-3 #1a1a28
border: rgba(255,255,255,0.06) default · 0.12 strong
text:   primary #e8e8f0 · sub #606075 · dim #30303f
accent: #4f46e5 · hover #4338ca · glow rgba(79,70,229,0.12) · border rgba(79,70,229,0.25)
status: green #22c55e/#4ade80 · amber #f59e0b/#fbbf24 · red #ef4444/#f87171 · blue #3b82f6/#60a5fa
```

If a hex is not in DESIGN_SYSTEM.md, do not use it. Check its Never-Use table (§6) before introducing any value.

### Patterns
- Card: `bg-[#0f0f18] border border-[rgba(255,255,255,0.06)] rounded-lg`
- Elevation = border opacity, never drop shadows. Radius ≤ 12px.
- shadcn/Base UI primitives in `components/ui/` render dark via remapped `:root` vars — no `.dark` class anywhere.
- Recharts config, KPI/table patterns, agent tag colors: DESIGN_SYSTEM.md §5.
