const TRUST_STATS = [
  {
    value: '< 4s',
    label: 'Response time guarantee',
    borderColor: '#4f46e5',
  },
  {
    value: '80%+',
    label: 'Queries resolved without human',
    borderColor: '#22c55e',
  },
  {
    value: '0 data',
    label: 'Stored in plain text',
    borderColor: '#f59e0b',
  },
]

export function TrustSection() {
  return (
    <section
      className="py-20 px-6"
      style={{ background: '#0a0a13', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TRUST_STATS.map(s => (
            <div
              key={s.label}
              className="rounded-lg p-6"
              style={{
                background: '#0f0f18',
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: `2px solid ${s.borderColor}`,
              }}
            >
              <div
                className="font-mono font-semibold tabular-nums"
                style={{ fontSize: '32px', color: '#e8e8f0', lineHeight: 1 }}
              >
                {s.value}
              </div>
              <div
                className="mt-1"
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#606075' }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <p
          className="text-center mt-8"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#606075' }}
        >
          Built for regulated industries. GDPR-aware. PII scrubbed at ingestion.
        </p>
      </div>
    </section>
  )
}
