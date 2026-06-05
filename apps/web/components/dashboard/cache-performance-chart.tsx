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

export type CacheChartRow = { day: string; hitRate: number; missRate: number }

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#141420',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 6,
      padding: '8px 10px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11,
    }}>
      <p style={{ color: '#606075', marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex gap-3 justify-between">
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: '#e8e8f0' }}>{p.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

export function CachePerformanceChart({ data }: { data: CacheChartRow[] }) {
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
            <linearGradient id="grad-hit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-miss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="0" vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={tickStyle} tickFormatter={v => v.slice(5)} />
          <YAxis tickLine={false} axisLine={false} tick={tickStyle} width={30} unit="%" />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="hitRate" name="Hit" stroke="#22c55e" strokeWidth={1.5} fill="url(#grad-hit)" />
          <Area type="monotone" dataKey="missRate" name="Miss" stroke="#f59e0b" strokeWidth={1} fill="url(#grad-miss)" strokeDasharray="3 2" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
