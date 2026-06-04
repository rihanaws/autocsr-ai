import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')

  const reviewCount = await db.reviewItem.count({
    where: { tenantId: session.user.tenantId, status: 'PENDING' },
  })

  const tenant = await db.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { name: true, tier: true },
  })

  return (
    <div
      className="flex min-h-dvh"
      style={{ background: '#090910', color: '#e8e8f0' }}
    >
      <DashboardSidebar
        tenantName={tenant?.name ?? 'Unknown'}
        tier={tenant?.tier ?? 'FREE'}
        reviewCount={reviewCount}
      />
      <div className="flex flex-col flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
