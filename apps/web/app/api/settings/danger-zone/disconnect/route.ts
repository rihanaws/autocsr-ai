import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { env } from '@/lib/env'
import { Polar } from '@polar-sh/sdk'

const polar = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: 'sandbox',
})

export async function POST() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = session.user.tenantId

  try {
    const tenant = await db.tenant.findUnique({
      where:  { id: tenantId },
      select: { stripeCustomerId: true, tier: true, userId: true },
    })

    // 1. Cancel active Polar subscriptions (stripeCustomerId stores the Polar customer id)
    if (tenant?.stripeCustomerId && tenant.tier !== 'FREE') {
      try {
        const pages = await polar.subscriptions.list({
          customerId: tenant.stripeCustomerId,
          active:     true,
        })
        for await (const page of pages) {
          for (const sub of page.result.items) {
            if (sub.status === 'active') {
              await polar.subscriptions.revoke({ id: sub.id })
            }
          }
        }
      } catch (e) {
        console.error('[disconnect] Polar cancel error:', e)
        // Non-blocking — proceed with downgrade
      }
    }

    // 2. Downgrade tenant to FREE, clear billing references
    await db.tenant.update({
      where: { id: tenantId },
      data:  { tier: 'FREE', stripeCustomerId: null, stripeSubId: null },
    })

    // 3. Invalidate session cache so tier change takes effect immediately
    if (tenant?.userId) {
      await redis.del(`session:tenant:${tenant.userId}`).catch(() => null)
    }

    return NextResponse.json({ disconnected: true })
  } catch (e) {
    console.error('[disconnect] error:', e)
    return NextResponse.json({ error: 'Disconnect failed' }, { status: 500 })
  }
}
