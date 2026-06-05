import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

function firstOfMonth() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')
  const tenantId = session.user.tenantId

  const [reviewCount, tenant, usedThisMonth] = await Promise.all([
    db.reviewItem.count({ where: { tenantId, status: 'PENDING' } }),
    db.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, tier: true },
    }),
    db.queryEvent.count({ where: { tenantId, createdAt: { gte: firstOfMonth() } } }),
  ])

  return (
    <div
      className="flex min-h-dvh"
      style={{ background: '#090910', color: '#e8e8f0' }}
    >
      <DashboardSidebar
        tenantName={tenant?.name ?? 'Unknown'}
        tier={tenant?.tier ?? 'FREE'}
        reviewCount={reviewCount}
        usedThisMonth={usedThisMonth}
      />
      <div className="flex flex-col flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
