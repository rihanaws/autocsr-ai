import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Topbar } from '@/components/dashboard/topbar'
import { ReviewCard } from '@/components/dashboard/review-card'

export default async function ReviewQueuePage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')
  const tenantId = session.user.tenantId

  const items = await db.reviewItem.findMany({
    where: { tenantId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <>
      <Topbar title="Review Queue" />
      <div className="p-5 overflow-auto">
        {items.length === 0 && (
          <div
            className="rounded-lg p-10 text-center"
            style={{ border: '1px solid rgba(255,255,255,0.06)', background: '#0f0f18' }}
          >
            <p className="font-mono text-[11px]" style={{ color: '#606075' }}>
              No pending reviews — all clear
            </p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <ReviewCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </>
  )
}
