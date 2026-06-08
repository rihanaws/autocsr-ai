import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = session.user.tenantId

  const docs = await db.knowledgeDocument.findMany({
    where:   { tenantId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(docs)
}
