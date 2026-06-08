import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const bodySchema = z.object({ threshold: z.number().min(0.5).max(1.0) })

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = session.user.tenantId

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'threshold must be between 0.50 and 1.00' }, { status: 400 })
  }
  const { threshold } = parsed.data

  await db.tenant.update({
    where: { id: tenantId },
    data:  { cacheThreshold: threshold },
  })

  return NextResponse.json({ threshold })
}
