import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import type { Tier } from '@prisma/client'
import { createCheckout } from './actions'

const TIER_COLORS: Record<Tier, { bg: string; border: string; text: string }> = {
  FREE:       { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.12)', text: '#606075' },
  STARTER:    { bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.25)',  text: '#60a5fa' },
  GROWTH:     { bg: 'rgba(79,70,229,0.1)',    border: 'rgba(79,70,229,0.3)',    text: '#a5a0ff' },
  ENTERPRISE: { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)',   text: '#4ade80' },
}

const TIER_LIMITS: Record<Tier, number | null> = {
  FREE:       500,
  STARTER:    10000,
  GROWTH:     50000,
  ENTERPRISE: null,
}

const PLANS: Array<{
  tier: Tier
  label: string
  price: string
  features: { queries: string; agents: string; finetune: string; auditor: string; support: string }
}> = [
  {
    tier: 'FREE',
    label: 'Free',
    price: '$0/mo',
    features: { queries: '500 / mo', agents: '5 agents', finetune: '—', auditor: 'Basic', support: 'Community' },
  },
  {
    tier: 'STARTER',
    label: 'Starter',
    price: '$149/mo',
    features: { queries: '10,000 / mo', agents: '5 agents', finetune: 'Monthly', auditor: 'Full', support: 'Email' },
  },
  {
    tier: 'GROWTH',
    label: 'Growth',
    price: '$499/mo',
    features: { queries: '50,000 / mo', agents: 'Unlimited', finetune: 'Weekly', auditor: 'Full + Queue', support: 'Priority' },
  },
  {
    tier: 'ENTERPRISE',
    label: 'Enterprise',
    price: 'Custom',
    features: { queries: 'Unlimited', agents: 'Unlimited', finetune: 'On-demand', auditor: 'Full + API', support: 'Dedicated' },
  },
]

function barColor(pct: number) {
  if (pct > 95) return '#ef4444'
  if (pct > 80) return '#f59e0b'
  return '#4f46e5'
}


export default async function BillingPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')
  const tenantId = session.user.tenantId

  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)
  firstOfMonth.setHours(0, 0, 0, 0)

  const [tenant, usedThisMonth] = await Promise.all([
    db.tenant.findUnique({
      where: { id: tenantId },
      select: { tier: true, stripeCustomerId: true, createdAt: true },
    }),
    db.queryEvent.count({ where: { tenantId, createdAt: { gte: firstOfMonth } } }),
  ])

  if (!tenant) redirect('/login')

  const { tier } = tenant
  const tierColor = TIER_COLORS[tier]
  const limit = TIER_LIMITS[tier]
  const pct = limit ? (usedThisMonth / limit) * 100 : 0

  const isManaged = tier === 'GROWTH' || tier === 'ENTERPRISE'

  return (
    <>
      <DashboardTopbar title="Billing" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5 max-w-3xl">

        {/* Current plan */}
        <div
          className="rounded-lg p-5 flex items-start justify-between"
          style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <p className="font-mono text-[10px] mb-2 uppercase tracking-[0.08em]" style={{ color: '#606075' }}>
              Current Plan
            </p>
            <div className="flex items-center gap-3 mb-3">
              <span
                className="font-mono text-[11px] px-3 py-1 rounded-md"
                style={{ background: tierColor.bg, border: `1px solid ${tierColor.border}`, color: tierColor.text }}
              >
                {tier}
              </span>
              <span
                style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#e8e8f0' }}
              >
                {PLANS.find(p => p.tier === tier)?.price}
              </span>
            </div>
            <p className="text-[12px]" style={{ color: '#606075' }}>
              Member since {tenant.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </p>
          </div>

          {isManaged ? (
            <a
              href="https://sandbox.polar.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] px-4 py-2 rounded-md transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e8e8f0' }}
            >
              Manage Billing
            </a>
          ) : (
            <form action={createCheckout.bind(null, tier === 'FREE' ? 'STARTER' : 'GROWTH')}>
              <button
                type="submit"
                className="font-mono text-[11px] px-4 py-2 rounded-md transition-colors"
                style={{ background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.3)', color: '#a5a0ff' }}
              >
                Upgrade Plan →
              </button>
            </form>
          )}
        </div>

        {/* Usage this month */}
        <div
          className="rounded-lg p-5"
          style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="font-mono text-[10px] mb-3 uppercase tracking-[0.08em]" style={{ color: '#606075' }}>
            Usage This Month
          </p>
          {limit === null ? (
            <p className="font-mono text-[13px]" style={{ color: '#e8e8f0' }}>
              {usedThisMonth.toLocaleString()} queries — <span style={{ color: '#4ade80' }}>Unlimited</span>
            </p>
          ) : (
            <>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-mono tabular-nums" style={{ fontSize: 20, color: '#e8e8f0', letterSpacing: '-0.03em' }}>
                  {usedThisMonth.toLocaleString()}
                </span>
                <span className="font-mono text-[12px]" style={{ color: '#606075' }}>
                  / {limit.toLocaleString()} queries
                </span>
                <span className="font-mono text-[11px] ml-auto" style={{ color: pct > 80 ? '#f87171' : '#606075' }}>
                  {pct.toFixed(1)}%
                </span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, pct).toFixed(1)}%`, background: barColor(pct) }}
                />
              </div>
              {pct > 80 && (
                <p className="font-mono text-[10px] mt-2" style={{ color: '#f59e0b' }}>
                  Approaching limit — consider upgrading.
                </p>
              )}
            </>
          )}
        </div>

        {/* Plan comparison */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f0f18', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="font-mono text-[10px] text-left px-4 py-3 uppercase tracking-[0.08em]" style={{ color: '#606075' }}>
                  Feature
                </th>
                {PLANS.map(p => (
                  <th
                    key={p.tier}
                    className="font-mono text-[10px] text-center px-4 py-3 uppercase tracking-[0.08em]"
                    style={{
                      color: p.tier === tier ? TIER_COLORS[p.tier].text : '#606075',
                      borderLeft: p.tier === tier
                        ? `1px solid ${TIER_COLORS[p.tier].border}`
                        : '1px solid rgba(255,255,255,0.04)',
                      background: p.tier === tier ? TIER_COLORS[p.tier].bg : 'transparent',
                    }}
                  >
                    {p.label}
                    {p.tier === tier && (
                      <span className="block text-[8px] mt-0.5 normal-case tracking-normal" style={{ color: '#606075' }}>
                        current
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  { key: 'queries' as const, label: 'Queries / mo' },
                  { key: 'agents' as const, label: 'Agents' },
                  { key: 'finetune' as const, label: 'Fine-tuning' },
                  { key: 'auditor' as const, label: 'Auditor' },
                  { key: 'support' as const, label: 'Support' },
                ] as const
              ).map(row => (
                <tr key={row.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: '#0f0f18' }}>
                  <td className="font-mono text-[11px] px-4 py-2.5" style={{ color: '#606075' }}>
                    {row.label}
                  </td>
                  {PLANS.map(p => (
                    <td
                      key={p.tier}
                      className="font-mono text-[11px] text-center px-4 py-2.5"
                      style={{
                        color: p.tier === tier ? '#e8e8f0' : '#606075',
                        borderLeft: p.tier === tier
                          ? `1px solid ${TIER_COLORS[p.tier].border}`
                          : '1px solid rgba(255,255,255,0.04)',
                        background: p.tier === tier ? TIER_COLORS[p.tier].bg : 'transparent',
                      }}
                    >
                      {p.features[row.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </>
  )
}
