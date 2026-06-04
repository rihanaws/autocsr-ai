'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ value: number }>
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: '#141420',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        padding: '6px 10px',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: '#e8e8f0',
      }}
    >
      {(payload[0].value * 100).toFixed(1)}%
    </div>
  )
}

export function AccuracyChart({ data }: { data: Array<{ i: number; accuracy: number }> }) {
  const tickStyle = {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 8,
    fill: 'rgba(255,255,255,0.18)',
  }

  return (
    <div style={{ height: 140 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} vertical={false} />
          <XAxis dataKey="i" tickLine={false} axisLine={false} tick={tickStyle} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={tickStyle}
            domain={['auto', 'auto']}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="#4f46e5"
            strokeWidth={1.5}
            dot={{ fill: '#4f46e5', r: 2, strokeWidth: 0 }}
            activeDot={{ r: 3, fill: '#a5a0ff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
