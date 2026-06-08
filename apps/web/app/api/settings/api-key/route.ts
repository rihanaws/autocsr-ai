import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = session.user.tenantId

  const tenant = await db.tenant.findUnique({
    where:  { id: tenantId },
    select: { apiKey: true },
  })

  const key = tenant?.apiKey ?? ''
  return NextResponse.json({ keyPreview: key.slice(0, 8) + '••••••••••••••••' })
}
