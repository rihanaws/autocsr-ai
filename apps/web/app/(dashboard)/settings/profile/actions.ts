'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { generateSecret, generateURI, verify as otpVerify } from 'otplib'

export async function updateProfile(fd: FormData) {
  const session = await auth()
  if (!session?.user?.id || !session?.user?.tenantId) redirect('/login')

  const name = (fd.get('name') as string)?.trim()
  const company = (fd.get('company') as string)?.trim()

  if (!name) throw new Error('Name is required')
  if (!company) throw new Error('Company name is required')

  await Promise.all([
    db.user.update({ where: { id: session.user.id }, data: { name } }),
    db.tenant.update({ where: { id: session.user.tenantId }, data: { name: company } }),
  ])
}

export async function initiateTotpSetup(): Promise<{ secret: string; otpauthUrl: string; dataUrl: string }> {
  const session = await auth()
  if (!session?.user?.id || !session?.user?.email) redirect('/login')

  const secret = generateSecret({ crypto: undefined, base32: undefined, length: 20 })
  await redis.set(`totp_setup:${session.user.id}`, secret, { ex: 600 })

  const otpauthUrl = generateURI({ issuer: 'AutoCSR', label: session.user.email, secret, strategy: 'totp' })

  const QRCode = await import('qrcode')
  const dataUrl = await QRCode.toDataURL(otpauthUrl)

  return { secret, otpauthUrl, dataUrl }
}

export async function verifyAndEnableTotp(token: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const secret = await redis.get<string>(`totp_setup:${session.user.id}`)
  if (!secret) return { success: false, error: 'Setup session expired. Please try again.' }

  const valid = await otpVerify({ token, secret, strategy: 'totp' })
  if (!valid) return { success: false, error: 'Invalid code. Please try again.' }

  await db.user.update({
    where: { id: session.user.id },
    data: { totpSecret: secret, totpEnabled: true },
  })
  await redis.del(`totp_setup:${session.user.id}`)

  return { success: true }
}

export async function disableTotp(token: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { totpSecret: true },
  })

  if (!user?.totpSecret) return { success: false, error: '2FA is not enabled.' }

  const valid = await otpVerify({ token, secret: user.totpSecret, strategy: 'totp' })
  if (!valid) return { success: false, error: 'Invalid code.' }

  await db.user.update({
    where: { id: session.user.id },
    data: { totpSecret: null, totpEnabled: false },
  })

  return { success: true }
}

export async function signOutOtherSessions() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const jar = await cookies()
  const token =
    jar.get('authjs.session-token')?.value ??
    jar.get('__Secure-authjs.session-token')?.value

  if (!token) redirect('/login')

  const current = await db.session.findUnique({
    where: { sessionToken: token },
    select: { id: true },
  })
  if (!current) redirect('/login')

  await db.session.deleteMany({
    where: { userId: session.user.id, id: { not: current.id } },
  })
}
