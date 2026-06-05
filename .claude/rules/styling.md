---
paths:
  - "apps/web/**/*.tsx"
  - "apps/web/**/*.css"
---
# Styling Rules

- Tailwind v4: CSS-first. @import "tailwindcss" in globals.css. @theme {} for tokens.
- Never use Tailwind color-* classes for brand colors. Use arbitrary values: bg-[#0f0f18].
- All borders: border-[rgba(255,255,255,0.06)] not border-gray-*.
- All numbers/data values: font-mono class or style={{fontFamily:'JetBrains Mono,monospace'}}.
- Dark theme enforced. No white/light backgrounds on any dashboard component.
- Read .claude/skills/design-system.md before writing any new component styles.
