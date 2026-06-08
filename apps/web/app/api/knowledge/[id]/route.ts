import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = session.user.tenantId
  const { id } = await params

  const doc = await db.knowledgeDocument.findUnique({ where: { id } })
  if (!doc || doc.tenantId !== tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.knowledgeDocument.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
