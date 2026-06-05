'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard',      label: 'Overview'      },
  { href: '/agents',         label: 'Agents'        },
  { href: '/cache',          label: 'Cache'         },
  { href: '/review-queue',   label: 'Review Queue'  },
  { href: '/training',       label: 'Training'      },
  { href: '/knowledge',      label: 'Knowledge'     },
  { href: '/settings',       label: 'Settings'      },
]

const AGENTS = [
  { name: 'deposit',      qpm: 24, status: 'online' },
  { name: 'withdrawal',   qpm: 18, status: 'online' },
  { name: 'verification', qpm: 7,  status: 'online' },
  { name: 'onboarding',   qpm: 12, status: 'online' },
  { name: 'general',      qpm: 3,  status: 'degraded' },
] as const

const TIER_LIMITS: Record<string, number | null> = {
  FREE:       500,
  STARTER:    10000,
  GROWTH:     50000,
  ENTERPRISE: null,
}

function barColor(pct: number) {
  if (pct > 95) return '#ef4444'
  if (pct > 80) return '#f59e0b'
  return '#4f46e5'
}

interface Props {
  tenantName: string
  tier: string
  reviewCount: number
  usedThisMonth: number
}

export function DashboardSidebar({ tenantName, tier, reviewCount, usedThisMonth }: Props) {
  const pathname = usePathname()

  return (
    <aside
      className="flex flex-col shrink-0"
      style={{
        width: 200,
        background: '#0f0f18',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        minHeight: '100dvh',
      }}
    >
      {/* Logo */}
      <div
        className="px-4 pb-4 pt-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-1.5">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#e8e8f0' }}>
            AutoCSR
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: 8,
              background: 'rgba(79,70,229,0.12)',
              border: '1px solid rgba(79,70,229,0.25)',
              color: '#a5a0ff',
              padding: '1px 4px',
              borderRadius: 3,
            }}
          >
            BETA
          </span>
        </div>
        <div className="font-mono mt-1" style={{ fontSize: 9, color: '#606075', letterSpacing: '0.05em' }}>
          {tenantName} · {tier}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-2 py-3 flex-1">
        <p
          className="font-mono uppercase mb-1 px-2"
          style={{ fontSize: 9, color: '#30303f', letterSpacing: '0.1em' }}
        >
          Platform
        </p>
        {NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const isReview = item.href === '/review-queue'
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors duration-100"
              style={
                active
                  ? {
                      background: 'rgba(79,70,229,0.12)',
                      border: '1px solid rgba(79,70,229,0.25)',
                      color: '#a5a0ff',
                    }
                  : {
                      border: '1px solid transparent',
                      color: '#606075',
                    }
              }
            >
              {item.label}
              {isReview && reviewCount > 0 && (
                <span
                  className="font-mono"
                  style={{
                    fontSize: 8,
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#f87171',
                    padding: '1px 4px',
                    borderRadius: 8,
                  }}
                >
                  {reviewCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Usage meter */}
      {(() => {
        const limit = TIER_LIMITS[tier] ?? null
        const pct = limit ? (usedThisMonth / limit) * 100 : 0
        return (
          <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-mono uppercase mb-1" style={{ fontSize: 9, color: '#30303f', letterSpacing: '0.1em' }}>
              Queries this month
            </p>
            {limit === null ? (
              <p className="font-mono" style={{ fontSize: 10, color: '#606075' }}>Unlimited</p>
            ) : (
              <>
                <p className="font-mono mb-1.5 tabular-nums" style={{ fontSize: 10, color: '#606075' }}>
                  {usedThisMonth.toLocaleString()} / {limit.toLocaleString()}
                </p>
                <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, pct).toFixed(1)}%`, background: barColor(pct) }}
                  />
                </div>
              </>
            )}
          </div>
        )
      })()}

      {/* Agent health */}
      <div
        className="px-4 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p
          className="font-mono uppercase mb-2"
          style={{ fontSize: 9, color: '#30303f', letterSpacing: '0.1em' }}
        >
          Agent Health
        </p>
        <div className="flex flex-col gap-1.5">
          {AGENTS.map(a => (
            <div key={a.name} className="flex items-center gap-2">
              <span
                className={
                  a.status === 'online'
                    ? 'w-1.5 h-1.5 rounded-full shrink-0 bg-[#22c55e] shadow-[0_0_5px_rgba(34,197,94,0.5)]'
                    : 'w-1.5 h-1.5 rounded-full shrink-0 bg-[#f59e0b]'
                }
              />
              <span className="font-mono flex-1" style={{ fontSize: 9.5, color: '#606075' }}>
                {a.name}
              </span>
              <span className="font-mono" style={{ fontSize: 9, color: '#30303f' }}>
                {a.qpm}/m
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
