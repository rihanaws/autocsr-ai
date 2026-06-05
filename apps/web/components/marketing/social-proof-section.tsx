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
          How AutoCSR handles a live deposit query
        </h2>

        {/* Terminal mockup */}
        <div
          className="rounded-lg overflow-hidden mb-8"
          style={{ background: '#0a0a14', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Terminal title bar */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="size-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
            <span className="size-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
            <span className="size-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
            <span
              className="font-mono text-[10px] ml-2"
              style={{ color: '#606075' }}
            >
              autocsr · live session
            </span>
          </div>

          {/* Exchange */}
          <div className="px-5 py-6 space-y-5">
            {/* User message */}
            <div className="flex gap-3">
              <span
                className="font-mono text-[10px] shrink-0 mt-0.5"
                style={{ color: '#606075' }}
              >
                AGENT
              </span>
              <p
                className="font-mono text-[13px]"
                style={{ color: '#c0c0d0' }}
              >
                my gcash deposit of 5000 php is not showing
              </p>
            </div>

            {/* Routing line */}
            <div
              className="font-mono text-[10px] pl-12"
              style={{ color: '#4f46e5' }}
            >
              → AutoCSR · DEPOSIT agent · 847ms · cache miss
            </div>

            {/* AutoCSR response */}
            <div className="flex gap-3">
              <span
                className="font-mono text-[10px] shrink-0 mt-0.5"
                style={{ color: '#a5a0ff' }}
              >
                AUTO
              </span>
              <p
                className="font-mono text-[13px] leading-relaxed"
                style={{ color: '#e8e8f0' }}
              >
                Your GCash transaction is currently in a 15–30 min processing window.
                {' '}If not credited by [time+30min], please share your GCash reference
                {' '}number and we'll escalate to our payments team immediately.
              </p>
            </div>

            {/* Metrics bar */}
            <div
              className="font-mono text-[10px] pt-4 mt-2"
              style={{
                color: '#606075',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span className="tabular-nums">847ms</span>
              <span style={{ color: '#30303f' }}> · </span>
              <span className="tabular-nums">0.94 confidence</span>
              <span style={{ color: '#30303f' }}> · </span>
              <span style={{ color: '#22c55e' }}>cache written</span>
            </div>
          </div>
        </div>

        <p
          className="font-mono text-[12px]"
          style={{ color: '#606075' }}
        >
          Then the next 1,200 similar queries return in{' '}
          <span className="tabular-nums" style={{ color: '#22c55e' }}>12ms</span>
          {' '}from semantic cache.
        </p>
      </div>
    </section>
  )
}
