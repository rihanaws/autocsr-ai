import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Topbar } from '@/components/dashboard/topbar'
import { AddKnowledgeDialog, DeleteChunkButton } from '@/components/dashboard/knowledge-client'

const SOURCE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  faq:               { bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)',  text: '#60a5fa' },
  policy:            { bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.2)', text: '#c084fc' },
  escalation_guide:  { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  text: '#f59e0b' },
  resolved_case:     { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',   text: '#22c55e' },
}

export default async function KnowledgePage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')
  const tenantId = session.user.tenantId

  const chunks = await db.knowledgeChunk.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, content: true, source: true, agentType: true, createdAt: true },
  })

  return (
    <>
      <Topbar title="Knowledge Base" />
      <div className="flex-1 overflow-y-auto p-5">

        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <p className="font-mono text-[10px] uppercase" style={{ color: '#606075', letterSpacing: '0.05em' }}>
            {chunks.length} chunk{chunks.length !== 1 ? 's' : ''}
          </p>
          <AddKnowledgeDialog />
        </div>

        {chunks.length === 0 ? (
          /* Empty state */
          <div
            className="rounded-lg p-10 flex flex-col items-center text-center"
            style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 700,
                color: '#e8e8f0',
                marginBottom: 10,
              }}
            >
              No knowledge chunks yet
            </p>
            <p className="text-[12px] max-w-sm mb-6" style={{ color: '#606075', lineHeight: 1.6 }}>
              Add your FAQs, policies, and escalation guides to improve agent accuracy.
            </p>
            <AddKnowledgeDialog />
          </div>
        ) : (
          /* Table */
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f0f18', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Content', 'Source', 'Agent', 'Created', ''].map(h => (
                    <th
                      key={h}
                      className="font-mono text-[9px] text-left px-4 py-3"
                      style={{ color: '#30303f', letterSpacing: '0.05em' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chunks.map(chunk => {
                  const sc = SOURCE_COLORS[chunk.source] ?? { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: '#606075' }
                  return (
                    <tr
                      key={chunk.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: '#0a0a13' }}
                    >
                      <td className="px-4 py-3 max-w-xs" style={{ color: '#c0c0d0' }}>
                        <span className="line-clamp-2 leading-snug">{chunk.content.slice(0, 80)}{chunk.content.length > 80 ? '…' : ''}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-[9px] px-2 py-1 rounded whitespace-nowrap"
                          style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}
                        >
                          {chunk.source.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono" style={{ color: '#606075' }}>
                        {chunk.agentType ?? 'ALL'}
                      </td>
                      <td className="px-4 py-3 font-mono whitespace-nowrap" style={{ color: '#606075' }}>
                        {chunk.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <DeleteChunkButton id={chunk.id} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
