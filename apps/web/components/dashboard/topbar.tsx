export function Topbar({ title }: { title: string }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })

  return (
    <div
      className="flex items-center justify-between px-5 py-2.5 shrink-0"
      style={{
        background: '#0f0f18',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 700,
          color: '#e8e8f0',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </span>
      <div className="flex items-center gap-3">
        <span className="font-mono" style={{ fontSize: 9, color: '#30303f' }}>
          {dateStr}
        </span>
        <div
          className="flex items-center gap-1.5 font-mono"
          style={{
            fontSize: 9,
            color: '#22c55e',
            background: 'rgba(34,197,94,0.07)',
            border: '1px solid rgba(34,197,94,0.2)',
            padding: '2px 8px',
            borderRadius: 100,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#22c55e',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          LIVE
        </div>
      </div>
    </div>
  )
}
