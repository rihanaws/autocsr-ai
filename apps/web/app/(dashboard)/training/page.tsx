import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { AccuracyChart } from '@/components/dashboard/accuracy-chart'
import { TrainingCountdown } from '@/components/dashboard/training-countdown'

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  PROMOTED:   { bg: 'rgba(34,197,94,0.08)',   color: '#22c55e', border: 'rgba(34,197,94,0.2)',   label: 'PROMOTED'   },
  REJECTED:   { bg: 'rgba(239,68,68,0.08)',   color: '#ef4444', border: 'rgba(239,68,68,0.2)',   label: 'REJECTED'   },
  RUNNING:    { bg: 'rgba(245,158,11,0.08)',  color: '#f59e0b', border: 'rgba(245,158,11,0.2)',  label: 'RUNNING'    },
  QUEUED:     { bg: 'rgba(100,100,120,0.1)',  color: '#606075', border: 'rgba(100,100,120,0.15)', label: 'QUEUED'   },
  EVALUATING: { bg: 'rgba(79,70,229,0.08)',   color: '#a5a0ff', border: 'rgba(79,70,229,0.2)',   label: 'EVALUATING' },
  FAILED:     { bg: 'rgba(239,68,68,0.08)',   color: '#f87171', border: 'rgba(239,68,68,0.15)',  label: 'FAILED'     },
}

export default async function TrainingPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')
  const tenantId = session.user.tenantId

  const runs = await db.trainingRun.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const chartRuns = runs
    .filter(r => r.evalAccuracy != null)
    .slice(0, 10)
    .reverse()
    .map((r, i) => ({ i: i + 1, accuracy: r.evalAccuracy! }))

  return (
    <>
      <DashboardTopbar title="Training" />
      <div className="p-5 overflow-auto flex flex-col gap-6">
        {/* Next run countdown */}
        <div
          className="flex items-center justify-between rounded-lg px-4 py-3"
          style={{
            background: '#0f0f18',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div>
            <p className="text-[10px] mb-0.5" style={{ color: '#606075' }}>Next scheduled run</p>
            <p className="font-mono text-[11px]" style={{ color: '#e8e8f0' }}>Sunday 02:00 UTC</p>
          </div>
          <TrainingCountdown />
        </div>

        {/* Accuracy chart */}
        {chartRuns.length > 0 && (
          <div>
            <p
              className="font-mono uppercase text-[10px] mb-3"
              style={{ color: '#606075', letterSpacing: '0.05em' }}
            >
              Eval Accuracy Trend (last 10 runs)
            </p>
            <AccuracyChart data={chartRuns} />
          </div>
        )}

        {/* History table */}
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Date', 'Examples', 'Eval Accuracy', 'Delta', 'Status'].map(h => (
                <th
                  key={h}
                  className="font-mono text-left pb-2 pr-6 text-[10px] uppercase tracking-[0.08em] font-medium"
                  style={{ color: '#606075' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {runs.map(run => {
              const st = STATUS_STYLE[run.status] ?? STATUS_STYLE.QUEUED
              return (
                <tr key={run.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="py-2.5 pr-6 font-mono tabular-nums" style={{ fontSize: 11, color: '#606075' }}>
                    {run.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="py-2.5 pr-6 font-mono text-right tabular-nums" style={{ fontSize: 11, color: '#e8e8f0' }}>
                    {run.examplesUsed?.toLocaleString() ?? '—'}
                  </td>
                  <td className="py-2.5 pr-6 font-mono text-right tabular-nums" style={{ fontSize: 11, color: '#e8e8f0' }}>
                    {run.evalAccuracy != null ? `${(run.evalAccuracy * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-2.5 pr-6 font-mono text-right tabular-nums" style={{
                    fontSize: 11,
                    color: run.evalDelta == null ? '#606075' : run.evalDelta >= 0 ? '#22c55e' : '#ef4444',
                  }}>
                    {run.evalDelta != null
                      ? `${run.evalDelta >= 0 ? '+' : ''}${(run.evalDelta * 100).toFixed(1)}pp`
                      : '—'}
                  </td>
                  <td className="py-2.5">
                    <span
                      className="font-mono text-[9px] px-2 py-0.5 rounded"
                      style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color }}
                    >
                      {st.label}
                    </span>
                  </td>
                </tr>
              )
            })}
            {runs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center font-mono text-[11px]" style={{ color: '#30303f' }}>
                  No training runs yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
