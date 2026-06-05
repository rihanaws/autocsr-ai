import { db } from '@/lib/db'
import type { Tier } from '@prisma/client'

const TIER_LIMITS: Record<Tier, number | null> = {
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
  tenantId: string
  tier: Tier
}

export async function UsageMeter({ tenantId, tier }: Props) {
  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)
  firstOfMonth.setHours(0, 0, 0, 0)

  const used = await db.queryEvent.count({
    where: { tenantId, createdAt: { gte: firstOfMonth } },
  })

  const limit = TIER_LIMITS[tier]

  return (
    <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <p
        className="font-mono uppercase mb-1"
        style={{ fontSize: 9, color: '#30303f', letterSpacing: '0.1em' }}
      >
        Queries this month
      </p>
      {limit === null ? (
        <p className="font-mono" style={{ fontSize: 10, color: '#606075' }}>
          Unlimited
        </p>
      ) : (
        <>
          <p className="font-mono mb-1.5 tabular-nums" style={{ fontSize: 10, color: '#606075' }}>
            {used.toLocaleString()} / {limit.toLocaleString()}
          </p>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (used / limit) * 100).toFixed(1)}%`,
                background: barColor((used / limit) * 100),
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
