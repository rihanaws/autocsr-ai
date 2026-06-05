import { auth } from '@/lib/auth'
import { Topbar } from '@/components/dashboard/topbar'

export async function DashboardTopbar({ title }: { title: string }) {
  const session = await auth()
  return (
    <Topbar
      title={title}
      userName={session?.user?.name ?? null}
      userEmail={session?.user?.email ?? ''}
    />
  )
}
