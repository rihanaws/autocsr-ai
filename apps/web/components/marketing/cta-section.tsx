'use client'

export function CTASection() {
  return (
    <section
      className="py-24 px-6"
      style={{
        background: '#090910',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <p
          className="font-mono text-[10px] uppercase tracking-widest mb-4"
          style={{ color: '#a5a0ff' }}
        >
          Ready to deploy
        </p>
        <h2
          className="font-display font-bold text-balance mb-5"
          style={{
            fontSize: 'clamp(28px, 4vw, 48px)',
            letterSpacing: '-0.02em',
            color: '#e8e8f0',
          }}
        >
          30-day pilot. Zero commitment.
        </h2>
        <p
          className="text-pretty mb-10 mx-auto max-w-sm"
          style={{ fontSize: '15px', color: '#606075', lineHeight: '1.6' }}
        >
          We deploy AutoCSR into your existing LiveAgent setup and handle the
          entire integration. You measure the results.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="/signup"
            className="inline-flex items-center px-6 py-3 rounded-md text-sm font-medium text-white transition-colors duration-150"
            style={{ background: '#4f46e5' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#4338ca')}
            onMouseLeave={e => (e.currentTarget.style.background = '#4f46e5')}
          >
            Start Free Pilot
          </a>
          <a
            href="mailto:hello@autocsr.ai"
            className="inline-flex items-center text-sm transition-colors duration-150"
            style={{ color: '#606075' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e8e8f0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#606075')}
          >
            Talk to a human →
          </a>
        </div>
      </div>
    </section>
  )
}
