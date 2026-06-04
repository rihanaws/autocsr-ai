import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Topbar } from '@/components/dashboard/topbar'
import { QueryVolumeChart } from '@/components/dashboard/query-volume-chart'
import { LiveFeed } from '@/components/dashboard/live-feed'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')
  const tenantId = session.user.tenantId

  const todayStart = startOfToday()

  const [totalToday, resolvedToday, cacheHitsToday, chartData] =
    await Promise.all([
      db.queryEvent.count({ where: { tenantId, createdAt: { gte: todayStart } } }),
      db.queryEvent.count({ where: { tenantId, createdAt: { gte: todayStart }, resolved: true } }),
      db.queryEvent.count({ where: { tenantId, createdAt: { gte: todayStart }, cacheHit: true } }),
      // 7-day chart data
      db.$queryRaw<Array<{ day: string; agent_type: string; count: bigint }>>`
        SELECT
          DATE_TRUNC('day', "createdAt")::text AS day,
          "agentType"::text AS agent_type,
          COUNT(*) AS count
        FROM "QueryEvent"
        WHERE "tenantId" = ${tenantId}
          AND "createdAt" >= NOW() - INTERVAL '7 days'
        GROUP BY 1, 2
        ORDER BY 1
      `,
    ])

  const resolutionRate =
    totalToday > 0 ? ((resolvedToday / totalToday) * 100).toFixed(1) : '0.0'
  const cacheHitRate =
    totalToday > 0 ? ((cacheHitsToday / totalToday) * 100).toFixed(1) : '0.0'
  const costSaved = `$${(cacheHitsToday * 0.0005).toFixed(2)}`

  const kpis = [
    { label: 'Queries Today',    value: totalToday.toLocaleString() },
    { label: 'Resolution Rate',  value: `${resolutionRate}%` },
    { label: 'Cache Hit Rate',   value: `${cacheHitRate}%` },
    { label: 'Cost Saved Today', value: costSaved },
  ]

  // Normalise chart data for client component
  type ChartRow = { day: string; deposit: number; withdrawal: number; verification: number; onboarding: number; general: number }
  const chartMap = new Map<string, ChartRow>()
  for (const row of chartData) {
    const day = row.day.slice(0, 10)
    if (!chartMap.has(day)) {
      chartMap.set(day, { day, deposit: 0, withdrawal: 0, verification: 0, onboarding: 0, general: 0 })
    }
    const entry = chartMap.get(day)!
    const key = row.agent_type.toLowerCase() as keyof Omit<ChartRow, 'day'>
    if (key in entry) entry[key] = Number(row.count)
  }
  const chartRows = Array.from(chartMap.values()).sort((a, b) => a.day.localeCompare(b.day))

  return (
    <>
      <Topbar title="Overview" />
      {/* KPI strip */}
      <div
        className="grid shrink-0"
        style={{
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
          background: 'rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {kpis.map(k => (
          <div
            key={k.label}
            className="group relative overflow-hidden px-4 py-3.5"
            style={{ background: '#0f0f18' }}
          >
            <p className="text-[9.5px]" style={{ color: '#606075', marginBottom: 5 }}>
              {k.label}
            </p>
            <p
              className="font-mono font-semibold tabular-nums"
              style={{ fontSize: 20, letterSpacing: '-0.04em', color: '#e8e8f0', lineHeight: 1 }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main 2-col */}
      <div
        className="flex-1 grid overflow-hidden"
        style={{ gridTemplateColumns: '1fr 250px' }}
      >
        <div
          className="p-4 overflow-hidden"
          style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p
            className="font-mono uppercase text-[10px] mb-3"
            style={{ color: '#606075', letterSpacing: '0.05em' }}
          >
            Query Volume — 7d
          </p>
          <QueryVolumeChart data={chartRows} />
        </div>
        <div className="p-3 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p
              className="font-mono uppercase text-[10px]"
              style={{ color: '#606075', letterSpacing: '0.05em' }}
            >
              Live Feed
            </p>
          </div>
          <LiveFeed />
        </div>
      </div>
    </>
  )
}
