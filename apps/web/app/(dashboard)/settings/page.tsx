import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { ApiKeySection, InferenceEndpointSection, DangerZoneSection } from '@/components/dashboard/settings-client'

const TIER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  FREE:       { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', text: '#606075' },
  STARTER:    { bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)',  text: '#60a5fa' },
  GROWTH:     { bg: 'rgba(79,70,229,0.08)',   border: 'rgba(79,70,229,0.25)', text: '#a5a0ff' },
  ENTERPRISE: { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',  text: '#22c55e' },
}

function SectionCard({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div
      className="rounded-lg p-6"
      style={{
        background: '#0f0f18',
        border: danger ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 700,
          color: danger ? '#f87171' : '#e8e8f0',
          marginBottom: 16,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')

  const tenant = await db.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { name: true, slug: true, tier: true, apiKey: true, createdAt: true },
  })

  if (!tenant) redirect('/login')

  const tierColor = TIER_COLORS[tenant.tier] ?? TIER_COLORS.FREE
  const inferenceUrl = process.env.INFERENCE_SERVICE_URL ?? 'http://localhost:8000'

  return (
    <>
      <DashboardTopbar title="Settings" />
      <div className="flex-1 overflow-y-auto p-5 space-y-4 max-w-2xl">

        {/* Workspace */}
        <SectionCard title="Workspace">
          <div className="space-y-3">
            <div>
              <p className="font-mono text-[10px] mb-1" style={{ color: '#606075' }}>Tenant Name</p>
              <p className="font-mono text-[13px]" style={{ color: '#e8e8f0' }}>{tenant.name}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] mb-1" style={{ color: '#606075' }}>Slug</p>
              <p className="font-mono text-[12px]" style={{ color: '#606075' }}>{tenant.slug}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] mb-1.5" style={{ color: '#606075' }}>Tier</p>
              <span
                className="font-mono text-[10px] px-2 py-1 rounded"
                style={{ background: tierColor.bg, border: `1px solid ${tierColor.border}`, color: tierColor.text }}
              >
                {tenant.tier}
              </span>
            </div>
            <div>
              <p className="font-mono text-[10px] mb-1" style={{ color: '#606075' }}>Member Since</p>
              <p className="font-mono text-[12px]" style={{ color: '#606075' }}>
                {tenant.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* API Key */}
        <SectionCard title="API Key">
          <ApiKeySection apiKey={tenant.apiKey} />
        </SectionCard>

        {/* Inference Endpoint */}
        <SectionCard title="Inference Endpoint">
          <p className="text-[12px] mb-3" style={{ color: '#606075' }}>
            FastAPI inference service URL used for agent routing and response generation.
          </p>
          <InferenceEndpointSection url={inferenceUrl} />
        </SectionCard>

        {/* Danger Zone */}
        <SectionCard title="Danger Zone" danger>
          <DangerZoneSection />
        </SectionCard>

      </div>
    </>
  )
}
