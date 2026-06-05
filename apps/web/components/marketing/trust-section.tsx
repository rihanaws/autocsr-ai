const TRUST_STATS = [
  {
    value: '< 4s',
    label: 'Response time guarantee',
    detail: 'P99 SLA across all query types',
  },
  {
    value: '80%+',
    label: 'Queries resolved without human',
    detail: 'Complex cases route to human queue',
  },
  {
    value: '0 data',
    label: 'Stored in plain text',
    detail: 'AES-GCM encrypted at ingestion',
  },
]

export function TrustSection() {
  return (
    <section
      className="py-20 px-6"
      style={{ background: '#0a0a13', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {TRUST_STATS.map(s => (
            <div
              key={s.label}
              className="rounded-md p-6"
              style={{
                background: '#111119',
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: '3px solid #4f46e5',
              }}
            >
              <div
                className="font-mono font-semibold tabular-nums mb-2"
                style={{ fontSize: '36px', letterSpacing: '-0.04em', color: '#e8e8f0', lineHeight: 1 }}
              >
                {s.value}
              </div>
              <div
                className="font-mono text-[11px] font-medium mb-1"
                style={{ color: '#a5a0ff' }}
              >
                {s.label}
              </div>
              <div
                className="font-mono text-[10px]"
                style={{ color: '#606075' }}
              >
                {s.detail}
              </div>
            </div>
          ))}
        </div>

        <p
          className="font-mono text-[11px]"
          style={{ color: '#606075' }}
        >
          Built for regulated industries. GDPR-aware. PII scrubbed at ingestion.
        </p>
      </div>
    </section>
  )
}
