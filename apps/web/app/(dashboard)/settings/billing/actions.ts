'use server'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Polar } from '@polar-sh/sdk'
import { env } from '@/lib/env'

const polar = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: 'sandbox',
})

type UpgradeTier = 'STARTER' | 'GROWTH' | 'ENTERPRISE'

const PRODUCT_IDS: Record<UpgradeTier, string> = {
  STARTER:    env.POLAR_PRODUCT_ID_STARTER,
  GROWTH:     env.POLAR_PRODUCT_ID_GROWTH,
  ENTERPRISE: env.POLAR_PRODUCT_ID_ENTERPRISE,
}

export async function createCheckout(tier: UpgradeTier): Promise<never> {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')

  const productId = PRODUCT_IDS[tier]
  if (!productId) redirect('/settings/billing')

  const checkout = await polar.checkouts.create({
    products: [productId],
    successUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    externalCustomerId: session.user.tenantId,
    customerEmail: session.user.email ?? undefined,
    customerName: session.user.name ?? undefined,
  })

  redirect(checkout.url)
}
