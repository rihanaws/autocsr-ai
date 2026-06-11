import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = session.user.tenantId

  const apiKey = await db.apiKey.findFirst({
    where: { tenantId, revokedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { prefix: true },
  })

  if (!apiKey) {
    return NextResponse.json({ prefix: null })
  }

  return NextResponse.json({ prefix: apiKey.prefix })
}
