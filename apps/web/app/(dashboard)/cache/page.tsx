import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Topbar } from '@/components/dashboard/topbar'
import { CachePerformanceChart, type CacheChartRow } from '@/components/dashboard/cache-performance-chart'

function startOf24h() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000)
}

function startOfDay(daysAgo: number) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function CachePage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')
  const tenantId = session.user.tenantId

  const since24h = startOf24h()
  const since7d = startOfDay(7)

  const [totalLast24h, cacheHits24h, chartRaw, topHashes] = await Promise.all([
    db.queryEvent.count({ where: { tenantId, createdAt: { gte: since24h } } }),
    db.queryEvent.count({ where: { tenantId, createdAt: { gte: since24h }, cacheHit: true } }),
    db.$queryRaw<Array<{ day: string; hits: bigint; total: bigint }>>`
      SELECT
        DATE_TRUNC('day', "createdAt")::text AS day,
        COUNT(*) FILTER (WHERE "cacheHit" = true) AS hits,
        COUNT(*) AS total
      FROM "QueryEvent"
      WHERE "tenantId" = ${tenantId}
        AND "createdAt" >= ${since7d}
      GROUP BY 1
      ORDER BY 1
    `,
    db.$queryRaw<Array<{ queryHash: string; queryText: string; agentType: string; hitCount: bigint; lastHit: Date }>>`
      SELECT
        "queryHash",
        MAX("queryText") AS "queryText",
        MAX("agentType"::text) AS "agentType",
        COUNT(*) AS "hitCount",
        MAX("createdAt") AS "lastHit"
      FROM "QueryEvent"
      WHERE "tenantId" = ${tenantId}
        AND "cacheHit" = true
      GROUP BY "queryHash"
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `,
  ])

  const hitRate24h = totalLast24h > 0 ? ((cacheHits24h / totalLast24h) * 100).toFixed(1) : '0.0'
  const estSavings = `$${(cacheHits24h * 0.0005).toFixed(2)}`

  const chartData: CacheChartRow[] = chartRaw.map(r => {
    const total = Number(r.total)
    const hits = Number(r.hits)
    return {
      day: r.day.slice(0, 10),
      hitRate: total > 0 ? parseFloat(((hits / total) * 100).toFixed(1)) : 0,
      missRate: total > 0 ? parseFloat((((total - hits) / total) * 100).toFixed(1)) : 0,
    }
  })

  const kpis = [
    { label: 'Hit Rate (24h)', value: `${hitRate24h}%` },
    { label: 'Queries Cached Today', value: cacheHits24h.toLocaleString() },
    { label: 'Estimated Savings', value: estSavings },
  ]

  return (
    <>
      <Topbar title="Cache" />

      {/* KPI strip */}
      <div
        className="grid shrink-0"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          background: 'rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {kpis.map(k => (
          <div key={k.label} className="px-4 py-3.5" style={{ background: '#0f0f18' }}>
            <p className="text-[9.5px] mb-1" style={{ color: '#606075' }}>{k.label}</p>
            <p
              className="font-mono font-semibold tabular-nums"
              style={{ fontSize: 20, letterSpacing: '-0.04em', color: '#e8e8f0', lineHeight: 1 }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Two panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cache performance chart */}
          <div
            className="rounded-lg p-4"
            style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="font-mono uppercase text-[10px] mb-3" style={{ color: '#606075', letterSpacing: '0.05em' }}>
              Cache Performance — 7d
            </p>
            <CachePerformanceChart data={chartData} />
            <div className="flex gap-4 mt-2">
              {[{ color: '#22c55e', label: 'Hit rate' }, { color: '#f59e0b', label: 'Miss rate' }].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span style={{ width: 8, height: 2, background: l.color, borderRadius: 1, display: 'inline-block' }} />
                  <span className="font-mono text-[9px]" style={{ color: '#606075' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top cached patterns */}
          <div
            className="rounded-lg p-4"
            style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="font-mono uppercase text-[10px] mb-3" style={{ color: '#606075', letterSpacing: '0.05em' }}>
              Cached Patterns
            </p>
            {topHashes.length === 0 ? (
              <p className="font-mono text-[11px]" style={{ color: '#30303f' }}>No cache hits yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Query', 'Agent', 'Hits', 'Last Hit'].map(h => (
                        <th key={h} className="font-mono text-[9px] text-left pb-2 pr-3" style={{ color: '#30303f' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topHashes.map(row => (
                      <tr
                        key={row.queryHash}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      >
                        <td className="py-2 pr-3 max-w-[200px]" style={{ color: '#e8e8f0' }}>
                          <span className="block truncate">{row.queryText.slice(0, 60)}</span>
                        </td>
                        <td className="py-2 pr-3 font-mono" style={{ color: '#a5a0ff' }}>
                          {row.agentType}
                        </td>
                        <td className="py-2 pr-3 font-mono tabular-nums" style={{ color: '#22c55e' }}>
                          {Number(row.hitCount).toLocaleString()}
                        </td>
                        <td className="py-2 font-mono" style={{ color: '#606075' }}>
                          {new Date(row.lastHit).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Manual invalidation docs */}
        <div
          className="rounded-lg p-4"
          style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="font-mono uppercase text-[10px] mb-3" style={{ color: '#606075', letterSpacing: '0.05em' }}>
            Manual Invalidation
          </p>
          <p className="text-[12px] mb-3" style={{ color: '#606075' }}>
            To invalidate a cache entry, use the API:
          </p>
          <pre
            className="font-mono text-[11px] rounded-md px-4 py-3 overflow-x-auto"
            style={{
              background: '#080810',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#a5a0ff',
            }}
          >
            {'DELETE /api/cache/{queryHash}'}
          </pre>
          <p className="font-mono text-[10px] mt-3" style={{ color: '#30303f' }}>
            Include your API key in the Authorization header: Bearer {'<apiKey>'}
          </p>
        </div>
      </div>
    </>
  )
}
