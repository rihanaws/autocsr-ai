'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ background: '#090910', color: '#e8e8f0', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#606075', marginBottom: 8 }}>
            {error.digest ?? 'UNKNOWN'}
          </p>
          <p style={{ fontSize: 14, color: '#e8e8f0', marginBottom: 16 }}>Something went wrong.</p>
          <button
            onClick={reset}
            style={{ fontFamily: 'monospace', fontSize: 11, padding: '6px 16px', background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.25)', color: '#a5a0ff', borderRadius: 6, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
