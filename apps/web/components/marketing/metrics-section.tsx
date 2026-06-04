'use client'

import { useEffect, useRef, useState } from 'react'

interface Metric {
  value: number
  display: (v: number) => string
  label: string
}

const METRICS: Metric[] = [
  { value: 4821, display: v => Math.round(v).toLocaleString(), label: 'Queries resolved today'   },
  { value: 94,   display: v => Math.round(v) + 'ms',            label: 'Avg response time'        },
  { value: 61,   display: v => Math.round(v) + '%',             label: 'Cost reduction'           },
]

function AnimatedNumber({ metric, active }: { metric: Metric; active: boolean }) {
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!active) return
    const steps = 50
    const inc = metric.value / steps
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + inc, metric.value)
      setVal(current)
      if (current >= metric.value) clearInterval(timer)
    }, 1400 / steps)
    return () => clearInterval(timer)
  }, [active, metric.value])

  return (
    <div className="text-center px-8">
      <div
        className="font-mono font-semibold tabular-nums"
        style={{ fontSize: '52px', letterSpacing: '-0.04em', color: '#e8e8f0', lineHeight: 1 }}
      >
        {metric.display(val)}
      </div>
      <div
        className="font-mono text-[10px] uppercase tracking-widest mt-3"
        style={{ color: '#606075' }}
      >
        {metric.label}
      </div>
    </div>
  )
}

export function MetricsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      className="py-24 px-6"
      style={{ background: '#090910', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-0 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x"
          style={{ '--tw-divide-opacity': 1, borderColor: 'rgba(255,255,255,0.06)' } as React.CSSProperties}
        >
          {METRICS.map((m, i) => (
            <div key={m.label} className="w-full sm:w-auto py-10 sm:py-0"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <AnimatedNumber metric={m} active={active} />
            </div>
          ))}
        </div>

        <p
          className="font-mono text-[10px] text-center mt-14"
          style={{ color: '#30303f' }}
        >
          Powered by Hermes-3 8B + 5 domain LoRA adapters · Upstash semantic cache · Weekly QLoRA fine-tune
        </p>
      </div>
    </section>
  )
}
