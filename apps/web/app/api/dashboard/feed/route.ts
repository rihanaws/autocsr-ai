import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const events = await db.queryEvent.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      queryText: true,
      agentType: true,
      cacheHit: true,
      resolutionMs: true,
      createdAt: true,
    },
  })

  return NextResponse.json(events)
}
