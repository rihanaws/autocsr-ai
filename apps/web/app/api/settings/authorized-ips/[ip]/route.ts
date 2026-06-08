import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ ip: string }> },
) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = session.user.tenantId
  const { ip } = await params

  const tenant = await db.tenant.findUnique({
    where:  { id: tenantId },
    select: { authorizedIps: true },
  })
  const filtered = (tenant?.authorizedIps ?? []).filter(i => i !== ip)

  await db.tenant.update({
    where: { id: tenantId },
    data:  { authorizedIps: filtered },
  })
  return NextResponse.json({ deleted: true })
}
