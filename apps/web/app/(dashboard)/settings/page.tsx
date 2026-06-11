import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { SettingsTabs } from '@/components/dashboard/settings-tabs'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')

  const tenant = await db.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { id: true, name: true, slug: true, tier: true },
  })

  if (!tenant) redirect('/login')

  const apiKey = await db.apiKey.findFirst({
    where: { tenantId: tenant.id, revokedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { prefix: true, environment: true, createdAt: true },
  })

  return (
    <>
      <DashboardTopbar title="Settings" />
      <div className="flex-1 overflow-y-auto p-5 max-w-2xl">
        <SettingsTabs
          apiKey={apiKey}
          tenant={{ id: tenant.id, name: tenant.name, slug: tenant.slug, tier: tenant.tier }}
        />
      </div>
    </>
  )
}
