'use client'

import { useState } from 'react'

interface Tier {
  name: string
  monthly: number | null
  queries: string
  features: string[]
  cta: string
  href: string
  highlight: boolean
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    monthly: 0,
    queries: '500 queries/mo',
    features: [
      'Deposit + General agents',
      'Basic semantic cache',
      'Email support',
    ],
    cta: 'Get started',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Starter',
    monthly: 149,
    queries: '10,000 queries/mo',
    features: [
      'All 5 agents',
      'Semantic cache',
      'Standard analytics',
      'Email support',
    ],
    cta: 'Start trial',
    href: '/signup?plan=starter',
    highlight: false,
  },
  {
    name: 'Growth',
    monthly: 499,
    queries: '50,000 queries/mo',
    features: [
      'All 5 agents',
      'Weekly LoRA fine-tune',
      'LLM auditor (5% sample)',
      'Priority support',
      'Custom knowledge base',
    ],
    cta: 'Start trial',
    href: '/signup?plan=growth',
    highlight: true,
  },
  {
    name: 'Enterprise',
    monthly: null,
    queries: 'Unlimited queries',
    features: [
      'Everything in Growth',
      'Dedicated inference node',
      'SLA guarantee',
      'Custom integrations',
      'On-site onboarding',
    ],
    cta: 'Contact us',
    href: '/contact',
    highlight: false,
  },
]

const ANNUAL_DISCOUNT = 0.8

function formatPrice(monthly: number | null, annual: boolean): string {
  if (monthly === null) return 'Custom'
  if (monthly === 0) return '$0'
  const price = annual ? Math.round(monthly * ANNUAL_DISCOUNT) : monthly
  return `$${price}`
}

export function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <section className="py-24 px-6" style={{ background: '#0f0f18' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <h2
            className="font-display font-bold text-balance"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: '-0.02em', color: '#e8e8f0' }}
          >
            Simple, transparent pricing
          </h2>

          {/* Annual toggle */}
          <button
            onClick={() => setAnnual(v => !v)}
            className="flex items-center gap-3 self-start sm:self-auto"
            aria-pressed={annual}
          >
            <span className="font-mono text-[11px]" style={{ color: '#606075' }}>Monthly</span>
            <span
              className="relative inline-flex h-5 w-9 rounded-full transition-colors duration-150 flex-shrink-0"
              style={{ background: annual ? '#4f46e5' : 'rgba(255,255,255,0.08)' }}
            >
              <span
                className="absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform duration-150"
                style={{ transform: annual ? 'translateX(16px)' : 'translateX(0)' }}
              />
            </span>
            <span className="font-mono text-[11px]" style={{ color: annual ? '#a5a0ff' : '#606075' }}>
              Annual{' '}
              <span style={{ color: '#22c55e' }}>
                {annual ? '(−20%)' : ''}
              </span>
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map(tier => (
            <div
              key={tier.name}
              className="rounded-lg p-6 flex flex-col"
              style={{
                background: tier.highlight ? '#141420' : '#141420',
                border: tier.highlight
                  ? '1px solid rgba(79,70,229,0.4)'
                  : '1px solid rgba(255,255,255,0.06)',
                transform: tier.highlight ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className="font-display font-bold text-sm"
                  style={{ color: '#e8e8f0' }}
                >
                  {tier.name}
                </span>
                {tier.highlight && (
                  <span
                    className="font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(79,70,229,0.12)',
                      border: '1px solid rgba(79,70,229,0.25)',
                      color: '#a5a0ff',
                    }}
                  >
                    Most Popular
                  </span>
                )}
              </div>

              <div className="mb-1">
                <span
                  className="font-mono font-semibold tabular-nums"
                  style={{ fontSize: '36px', letterSpacing: '-0.04em', color: '#e8e8f0', lineHeight: 1 }}
                >
                  {formatPrice(tier.monthly, annual)}
                </span>
                {tier.monthly !== null && tier.monthly > 0 && (
                  <span className="font-mono text-[11px] ml-1" style={{ color: '#606075' }}>
                    /mo
                  </span>
                )}
              </div>

              <p className="font-mono text-[10px] mb-6" style={{ color: '#606075' }}>
                {tier.queries}
              </p>

              <ul className="space-y-2.5 flex-1 mb-8">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <svg
                      width={12} height={12}
                      viewBox="0 0 12 12"
                      className="mt-0.5 flex-shrink-0"
                      aria-hidden="true"
                    >
                      <circle cx={6} cy={6} r={5}
                        fill="none"
                        stroke={tier.highlight ? '#4f46e5' : 'rgba(255,255,255,0.12)'}
                        strokeWidth={1}
                      />
                      <path d="M3.5 6l1.5 1.5 3-3"
                        stroke={tier.highlight ? '#a5a0ff' : '#606075'}
                        strokeWidth={1}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-[11px] leading-snug" style={{ color: '#606075' }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={tier.href}
                className="block text-center py-2 rounded-md text-sm font-medium transition-colors duration-150"
                style={
                  tier.highlight
                    ? { background: '#4f46e5', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#606075', border: '1px solid rgba(255,255,255,0.06)' }
                }
                onMouseEnter={e => {
                  if (tier.highlight) e.currentTarget.style.background = '#4338ca'
                  else { e.currentTarget.style.color = '#e8e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }
                }}
                onMouseLeave={e => {
                  if (tier.highlight) e.currentTarget.style.background = '#4f46e5'
                  else { e.currentTarget.style.color = '#606075'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }
                }}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
