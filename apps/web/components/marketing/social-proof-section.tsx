export function SocialProofSection() {
  return (
    <section
      className="py-24 px-6"
      style={{ background: '#0f0f18', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-3xl mx-auto">
        <h2
          className="font-display font-bold text-balance mb-10"
          style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', letterSpacing: '-0.02em', color: '#e8e8f0' }}
        >
          Watch AutoCSR handle a live query
        </h2>

        <div
          className="rounded-xl p-6 font-mono"
          style={{ background: '#0a0a14', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p style={{ color: '#606075', fontSize: '12px' }}>
            {'> Agent: my gcash deposit of 5000 php is not showing'}
          </p>

          <div className="mt-4">
            <p style={{ color: '#4ade80', fontSize: '11px' }}>
              {'  AutoCSR → [DEPOSIT · 847ms · cache miss]'}
            </p>
            <p className="mt-2 leading-relaxed" style={{ color: '#e8e8f0', fontSize: '12px' }}>
              Your GCash transaction is currently in a 15–30 minute processing window.
              {' '}If not credited by [time+30min], share your GCash reference number
              {' '}and we will escalate to payments team immediately.
            </p>
          </div>

          <div
            className="mt-4 pt-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)', color: '#30303f', fontSize: '10px' }}
          >
            847ms · 0.94 confidence · cached for next 1,200 similar queries
          </div>
        </div>

        <p
          className="text-center mt-6"
          style={{ fontSize: '13px', color: '#606075' }}
        >
          The next 1,200 similar queries return in 12ms from semantic cache.
        </p>
      </div>
    </section>
  )
}
