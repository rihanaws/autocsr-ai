import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { ProfileForm } from '@/components/dashboard/profile-form'
import { TotpSetup } from '@/components/dashboard/totp-setup'
import { SignOutOtherSessionsButton } from '@/components/dashboard/sign-out-sessions'

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-6"
      style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 700,
          color: '#e8e8f0',
          marginBottom: 16,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id || !session?.user?.tenantId) redirect('/login')

  const [user, tenant, sessions, accounts] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true, totpEnabled: true },
    }),
    db.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true },
    }),
    db.session.findMany({
      where: { userId: session.user.id },
      orderBy: { expires: 'desc' },
    }),
    db.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true, providerAccountId: true },
    }),
  ])

  if (!user || !tenant) redirect('/login')

  return (
    <>
      <DashboardTopbar title="Profile & Security" />
      <div className="flex-1 overflow-y-auto p-5 space-y-4 max-w-2xl">

        {/* Profile */}
        <SectionCard title="Profile">
          <ProfileForm name={user.name ?? ''} company={tenant.name} />
        </SectionCard>

        {/* Connected Accounts */}
        <SectionCard title="Connected Accounts">
          <div className="space-y-3">
            {accounts.map(a => (
              <div key={`${a.provider}-${a.providerAccountId}`} className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] capitalize" style={{ color: '#e8e8f0' }}>{a.provider}</p>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: '#606075' }}>
                    {user.email}
                  </p>
                </div>
                <span
                  className="font-mono text-[9px] px-2 py-1 rounded"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}
                >
                  CONNECTED
                </span>
              </div>
            ))}
            {accounts.length === 0 && (
              <p className="font-mono text-[11px]" style={{ color: '#30303f' }}>No connected accounts.</p>
            )}
          </div>
        </SectionCard>

        {/* 2FA */}
        <SectionCard title="Two-Factor Authentication">
          <TotpSetup totpEnabled={user.totpEnabled} />
        </SectionCard>

        {/* Active Sessions */}
        <SectionCard title="Active Sessions">
          <div className="space-y-2 mb-4">
            {sessions.map((s, idx) => {
              const isCurrent = idx === 0
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md"
                  style={{
                    background: isCurrent ? 'rgba(79,70,229,0.06)' : 'transparent',
                    border: isCurrent ? '1px solid rgba(79,70,229,0.15)' : '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div>
                    <p className="font-mono text-[11px]" style={{ color: isCurrent ? '#a5a0ff' : '#e8e8f0' }}>
                      {isCurrent ? 'Current session' : 'Session'}
                    </p>
                    <p className="font-mono text-[10px] mt-0.5" style={{ color: '#606075' }}>
                      Expires {new Date(s.expires).toLocaleDateString()}
                    </p>
                  </div>
                  {isCurrent && (
                    <span
                      className="font-mono text-[9px] px-2 py-0.5 rounded"
                      style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)', color: '#a5a0ff' }}
                    >
                      ACTIVE
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          {sessions.length > 1 && (
            <SignOutOtherSessionsButton />
          )}
        </SectionCard>

      </div>
    </>
  )
}
