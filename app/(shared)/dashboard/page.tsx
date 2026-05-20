import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <AppShell user={user}>
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1d3fa0] mb-6">
          Dashboard
        </h1>
        <Card>
          <p className="text-sm text-slate-500 font-mono">
            Task &amp; progress widgets coming in Plan 2.
          </p>
        </Card>
      </div>
    </AppShell>
  )
}
