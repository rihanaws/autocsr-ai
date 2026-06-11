'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

export async function deleteQueryHistory(confirmation: string) {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')
  if (confirmation !== 'DELETE') throw new Error('Confirmation text did not match')

  await db.queryEvent.deleteMany({
    where: { tenantId: session.user.tenantId },
  })
}
