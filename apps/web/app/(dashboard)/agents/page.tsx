import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Topbar } from '@/components/dashboard/topbar'
import { AgentSparkline } from '@/components/dashboard/agent-sparkline'

const AGENTS = ['DEPOSIT', 'WITHDRAWAL', 'VERIFICATION', 'ONBOARDING', 'GENERAL'] as const

export default async function AgentsPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')
  const tenantId = session.user.tenantId

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const since7d  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000)

  const [stats, sparklines] = await Promise.all([
    db.$queryRaw<Array<{
      agent_type: string
      queries: bigint
      avg_ms: number | null
      avg_score: number | null
      flagged: bigint
    }>>`
      SELECT
        "agentType"::text AS agent_type,
        COUNT(*) AS queries,
        AVG("resolutionMs") AS avg_ms,
        AVG("auditorScore") AS avg_score,
        COUNT(*) FILTER (WHERE "flaggedForReview") AS flagged
      FROM "QueryEvent"
      WHERE "tenantId" = ${tenantId}
        AND "createdAt" >= ${since30d}
      GROUP BY "agentType"
    `,
    db.$queryRaw<Array<{ agent_type: string; day: string; count: bigint }>>`
      SELECT
        "agentType"::text AS agent_type,
        DATE_TRUNC('day', "createdAt")::text AS day,
        COUNT(*) AS count
      FROM "QueryEvent"
      WHERE "tenantId" = ${tenantId}
        AND "createdAt" >= ${since7d}
      GROUP BY 1, 2
      ORDER BY 2
    `,
  ])

  const statsMap = new Map(stats.map(s => [s.agent_type, s]))

  // Build sparkline data per agent
  const sparkMap = new Map<string, number[]>()
  for (const row of sparklines) {
    const a = row.agent_type
    if (!sparkMap.has(a)) sparkMap.set(a, Array(7).fill(0))
    const dayOffset = Math.floor(
      (Date.now() - new Date(row.day).getTime()) / (24 * 60 * 60 * 1000)
    )
    const idx = 6 - Math.min(6, Math.max(0, dayOffset))
    sparkMap.get(a)![idx] = Number(row.count)
  }

  return (
    <>
      <Topbar title="Agents" />
      <div className="p-5 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Agent', 'Queries (30d)', 'Avg Ms', 'Avg Score', 'Flagged', 'Trend 7d', 'Status', 'Adapter'].map(h => (
                <th
                  key={h}
                  className="font-mono text-left pb-2 pr-6 text-[9px] uppercase tracking-wider"
                  style={{ color: '#606075' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AGENTS.map(agent => {
              const s = statsMap.get(agent)
              const spark = sparkMap.get(agent) ?? Array(7).fill(0)
              const online = agent !== 'GENERAL'
              return (
                <tr
                  key={agent}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <td className="py-3 pr-6">
                    <span
                      className="font-mono"
                      style={{ fontSize: 11, color: '#e8e8f0' }}
                    >
                      {agent.toLowerCase()}
                    </span>
                  </td>
                  <td className="py-3 pr-6 font-mono text-right tabular-nums" style={{ color: '#e8e8f0', fontSize: 11 }}>
                    {s ? Number(s.queries).toLocaleString() : '0'}
                  </td>
                  <td className="py-3 pr-6 font-mono text-right tabular-nums" style={{ color: '#e8e8f0', fontSize: 11 }}>
                    {s?.avg_ms != null ? Math.round(s.avg_ms) : '—'}
                  </td>
                  <td className="py-3 pr-6 font-mono text-right tabular-nums" style={{ color: '#e8e8f0', fontSize: 11 }}>
                    {s?.avg_score != null ? s.avg_score.toFixed(2) : '—'}
                  </td>
                  <td className="py-3 pr-6 font-mono text-right tabular-nums" style={{ color: s && Number(s.flagged) > 0 ? '#f87171' : '#606075', fontSize: 11 }}>
                    {s ? Number(s.flagged) : 0}
                  </td>
                  <td className="py-3 pr-6">
                    <AgentSparkline data={spark} />
                  </td>
                  <td className="py-3 pr-6">
                    <div className="flex items-center gap-1.5">
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: online ? '#22c55e' : '#f59e0b',
                          boxShadow: online ? '0 0 5px rgba(34,197,94,0.4)' : 'none',
                        }}
                      />
                      <span className="font-mono text-[9px]" style={{ color: online ? '#22c55e' : '#f59e0b' }}>
                        {online ? 'online' : 'degraded'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-[9px]" style={{ color: '#606075' }}>
                    LoRA-{['DEPOSIT','WITHDRAWAL','VERIFICATION','ONBOARDING','GENERAL'].indexOf(agent) + 1}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
