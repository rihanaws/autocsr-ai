'use client'

import { useEffect, useState } from 'react'

function nextSundayUTC(): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const daysUntilSunday = (7 - day) % 7 || 7
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilSunday,
    2, 0, 0, 0
  ))
  return next
}

function fmt(ms: number) {
  if (ms <= 0) return '00:00:00'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':')
}

export function TrainingCountdown() {
  const [remaining, setRemaining] = useState(() => nextSundayUTC().getTime() - Date.now())

  useEffect(() => {
    const t = setInterval(() => {
      setRemaining(nextSundayUTC().getTime() - Date.now())
    }, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <span className="font-mono tabular-nums" style={{ fontSize: 18, color: '#a5a0ff', letterSpacing: '-0.03em' }}>
      {fmt(remaining)}
    </span>
  )
}
