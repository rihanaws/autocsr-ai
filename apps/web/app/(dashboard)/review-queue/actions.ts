'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

async function requireTenant() {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Unauthorized')
  return session.user.tenantId
}

export async function approveReview(id: string) {
  const tenantId = await requireTenant()
  await db.reviewItem.updateMany({
    where: { id, tenantId },
    data: { status: 'APPROVED', reviewedAt: new Date() },
  })
  revalidatePath('/review-queue')
}

export async function rejectReview(id: string) {
  const tenantId = await requireTenant()
  await db.reviewItem.updateMany({
    where: { id, tenantId },
    data: { status: 'REJECTED', reviewedAt: new Date() },
  })
  revalidatePath('/review-queue')
}

export async function correctReview(id: string, correction: string) {
  const tenantId = await requireTenant()
  await db.reviewItem.updateMany({
    where: { id, tenantId },
    data: { status: 'CORRECTED', correction, reviewedAt: new Date() },
  })
  revalidatePath('/review-queue')
}
