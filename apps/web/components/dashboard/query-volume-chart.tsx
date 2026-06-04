'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type Row = {
  day: string
  deposit: number
  withdrawal: number
  verification: number
  onboarding: number
  general: number
}

const SERIES = [
  { key: 'deposit',      color: '#22c55e' },
  { key: 'withdrawal',   color: '#f59e0b' },
  { key: 'verification', color: '#c084fc' },
  { key: 'onboarding',   color: '#60a5fa' },
] as const

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: '#141420',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        padding: '8px 10px',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
      }}
    >
      <p style={{ color: '#606075', marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex gap-3 justify-between">
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: '#e8e8f0' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function QueryVolumeChart({ data }: { data: Row[] }) {
  const tickStyle = {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 8,
    fill: 'rgba(255,255,255,0.18)',
  }

  return (
    <div style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            {SERIES.map(s => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={tickStyle}
            tickFormatter={v => v.slice(5)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={tickStyle}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          {SERIES.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={i === 0 ? 1.5 : 1}
              fill={`url(#grad-${s.key})`}
              strokeDasharray={i > 0 ? '3 2' : undefined}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
