import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

export async function GET() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')

  const tenant = await db.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { apiKey: true },
  })

  const key = tenant?.apiKey ?? ''
  return NextResponse.json({ keyPreview: key.slice(0, 8) + '••••••••••••••••' })
}
