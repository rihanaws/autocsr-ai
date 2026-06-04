'use client'

import useSWR from 'swr'

type FeedItem = {
  id: string
  queryText: string
  agentType: string
  cacheHit: boolean
  resolutionMs: number | null
  createdAt: string
}

const TAG_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  DEPOSIT:      { bg: 'rgba(34,197,94,0.1)',   color: '#4ade80', border: 'rgba(34,197,94,0.18)'   },
  WITHDRAWAL:   { bg: 'rgba(245,158,11,0.1)',  color: '#fbbf24', border: 'rgba(245,158,11,0.18)'  },
  VERIFICATION: { bg: 'rgba(168,85,247,0.1)',  color: '#c084fc', border: 'rgba(168,85,247,0.18)'  },
  ONBOARDING:   { bg: 'rgba(59,130,246,0.1)',  color: '#60a5fa', border: 'rgba(59,130,246,0.18)'  },
  GENERAL:      { bg: 'rgba(100,100,120,0.15)', color: '#9ca3af', border: 'rgba(100,100,120,0.2)' },
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

function timeStr(iso: string) {
  return new Date(iso).toTimeString().slice(0, 8)
}

export function LiveFeed() {
  const { data } = useSWR<FeedItem[]>('/api/dashboard/feed', fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: false,
  })

  const items = data ?? []

  return (
    <div className="flex flex-col gap-0 overflow-hidden flex-1">
      {items.length === 0 && (
        <p className="font-mono text-[10px] mt-4 text-center" style={{ color: '#30303f' }}>
          No queries yet
        </p>
      )}
      {items.map(item => {
        const tag = TAG_STYLE[item.agentType] ?? TAG_STYLE.GENERAL
        return (
          <div
            key={item.id}
            className="py-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="font-mono uppercase"
                style={{
                  fontSize: 8,
                  padding: '1px 4px',
                  borderRadius: 2,
                  background: tag.bg,
                  color: tag.color,
                  border: `1px solid ${tag.border}`,
                  letterSpacing: '0.05em',
                }}
              >
                {item.agentType}
              </span>
              {item.cacheHit && (
                <span
                  className="font-mono"
                  style={{
                    fontSize: 7.5,
                    color: '#22c55e',
                    background: 'rgba(34,197,94,0.07)',
                    border: '1px solid rgba(34,197,94,0.15)',
                    padding: '1px 4px',
                    borderRadius: 2,
                  }}
                >
                  CACHED
                </span>
              )}
              <span
                className="font-mono ml-auto"
                style={{ fontSize: 8.5, color: '#30303f' }}
              >
                {timeStr(item.createdAt)}
              </span>
            </div>
            <p
              className="truncate text-[10.5px]"
              style={{ color: '#606075' }}
              title={item.queryText}
            >
              {item.queryText}
            </p>
            <p className="font-mono mt-0.5" style={{ fontSize: 8.5, color: '#30303f' }}>
              {item.cacheHit ? 'cache · ' : 'llm · '}
              {item.resolutionMs != null ? `${item.resolutionMs}ms` : '—'}
            </p>
          </div>
        )
      })}
    </div>
  )
}
