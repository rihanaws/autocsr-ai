import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const IP_RE = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/

export async function GET() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = session.user.tenantId

  const tenant = await db.tenant.findUnique({
    where:  { id: tenantId },
    select: { authorizedIps: true },
  })
  return NextResponse.json({ ips: tenant?.authorizedIps ?? [] })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = session.user.tenantId

  const body = await req.json() as { ip?: unknown }
  if (typeof body.ip !== 'string' || !IP_RE.test(body.ip)) {
    return NextResponse.json({ error: 'Invalid IP' }, { status: 400 })
  }

  await db.tenant.update({
    where: { id: tenantId },
    data:  { authorizedIps: { push: body.ip } },
  })
  return NextResponse.json({ ok: true })
}
