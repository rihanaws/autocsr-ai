import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = session.user.tenantId

  return NextResponse.json({
    scheduled: true,
    message:   'Tenant deprovisioning scheduled. Contact support@techsci.co to confirm.',
    tenantId,
  })
}
