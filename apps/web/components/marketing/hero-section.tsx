'use client'

import { useEffect, useRef, useState } from 'react'

function LiveCounter() {
  const [count, setCount] = useState(0)
  const target = 4821

  useEffect(() => {
    const duration = 1800
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + increment, target)
      setCount(Math.round(current))
      if (current >= target) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="rounded-lg border p-5 w-full max-w-xs"
      style={{
        background: '#0f0f18',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="font-mono text-4xl font-semibold tabular-nums"
        style={{ color: '#e8e8f0', letterSpacing: '-0.04em' }}
      >
        {count.toLocaleString()}
      </div>
      <div
        className="font-mono text-[10px] mt-1 tracking-wide uppercase"
        style={{ color: '#606075' }}
      >
        Queries resolved today
      </div>
      <div
        className="font-mono text-[11px] mt-4 pt-4"
        style={{
          color: '#30303f',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        94ms avg · 68% cached · $0 infra to start
      </div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section
      className="relative min-h-dvh flex items-center overflow-hidden"
      style={{ background: '#090910' }}
    >
      {/* Radial glow — pure CSS, no JS */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 30% 50%, rgba(79,70,229,0.13) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 lg:py-32">
        <div className="flex flex-col lg:flex-row lg:items-center gap-16 lg:gap-24">

          {/* Left */}
          <div className="flex-1 min-w-0">
            <p
              className="font-mono text-[10px] tracking-widest uppercase mb-6"
              style={{ color: '#a5a0ff' }}
            >
              AI-NATIVE · CSR AUTOMATION
            </p>

            <h1
              className="font-display font-bold text-balance"
              style={{
                fontSize: 'clamp(48px, 7vw, 72px)',
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
                color: '#e8e8f0',
              }}
            >
              21 agents.<br />One AI.
            </h1>

            <p
              className="text-pretty mt-6 max-w-md"
              style={{
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#606075',
                fontFamily: 'var(--font-body)',
              }}
            >
              Cut your betting platform's CSR cost by 61%.
              Deployed in 30 days. No retrenchment overnight.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-10">
              <a
                href="/signup"
                className="inline-flex items-center px-5 py-2.5 rounded-md text-sm font-medium text-white transition-colors duration-150"
                style={{ background: '#4f46e5' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#4338ca')}
                onMouseLeave={e => (e.currentTarget.style.background = '#4f46e5')}
              >
                Start Free Pilot
              </a>
              <a
                href="/demo"
                className="inline-flex items-center text-sm transition-colors duration-150"
                style={{ color: '#606075' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e8e8f0')}
                onMouseLeave={e => (e.currentTarget.style.color = '#606075')}
              >
                See live demo →
              </a>
            </div>
          </div>

          {/* Right */}
          <div className="flex-shrink-0 flex justify-center lg:justify-end">
            <LiveCounter />
          </div>
        </div>
      </div>
    </section>
  )
}
