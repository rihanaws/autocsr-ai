'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { randomBytes } from 'crypto'

export async function rotateApiKey() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')

  const newKey = randomBytes(32).toString('hex')
  await db.tenant.update({
    where: { id: session.user.tenantId },
    data: { apiKey: newKey },
  })
}

export async function deleteQueryHistory(confirmation: string) {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')
  if (confirmation !== 'DELETE') throw new Error('Confirmation text did not match')

  await db.queryEvent.deleteMany({
    where: { tenantId: session.user.tenantId },
  })
}
