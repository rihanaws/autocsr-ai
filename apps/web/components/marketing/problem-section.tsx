'use client'

import { useEffect, useRef, useState } from 'react'

interface Stat {
  label: string
  before: string
  after: string
}

const STATS: Stat[] = [
  { label: 'Monthly cost',        before: '14,00,000 BDT/mo', after: '3,45,000 BDT/mo'      },
  { label: 'Agents required',     before: '21 human agents',  after: '5 AI agents + cache'   },
  { label: 'Avg response time',   before: '6h avg response',  after: '94ms avg response'     },
  { label: 'Weekend coverage',    before: 'No weekend coverage', after: '24/7/365 autonomous' },
]

export function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.25 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-24 px-6" style={{ background: '#090910' }}>
      <div className="max-w-5xl mx-auto">
        <h2
          className="font-display font-bold text-balance mb-14"
          style={{ fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: '-0.02em', color: '#e8e8f0' }}
        >
          The status quo is costing you{' '}
          <span className="font-mono" style={{ color: '#f59e0b' }}>14L BDT</span> every month
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Before */}
          <div
            className="rounded-lg p-6"
            style={{
              background: '#14140a',
              border: '1px solid rgba(245,158,11,0.15)',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(-16px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
          >
            <p
              className="font-mono text-[10px] uppercase tracking-widest mb-5"
              style={{ color: '#f59e0b' }}
            >
              Before AutoCSR
            </p>
            <div className="space-y-4">
              {STATS.map(s => (
                <div key={s.label}>
                  <p className="text-[10px] mb-1" style={{ color: '#606075' }}>{s.label}</p>
                  <p className="font-mono text-lg font-semibold" style={{ color: '#f59e0b' }}>
                    {s.before}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* After */}
          <div
            className="rounded-lg p-6"
            style={{
              background: '#0a100a',
              border: '1px solid rgba(34,197,94,0.15)',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(16px)',
              transition: 'opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s',
            }}
          >
            <p
              className="font-mono text-[10px] uppercase tracking-widest mb-5"
              style={{ color: '#22c55e' }}
            >
              After AutoCSR
            </p>
            <div className="space-y-4">
              {STATS.map(s => (
                <div key={s.label}>
                  <p className="text-[10px] mb-1" style={{ color: '#606075' }}>{s.label}</p>
                  <p className="font-mono text-lg font-semibold" style={{ color: '#22c55e' }}>
                    {s.after}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
