import { getCurrentUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'

async function getDashboardStats() {
  const supabase = await createClient()
  const [
    { count: openBlockers },
    { count: pendingRequests },
    { count: pendingBudget },
    { count: totalTasks },
    { count: doneTasks },
    { data: milestones },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('blockers').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('resource_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('budget_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done'),
    supabase.from('event_milestones')
      .select('id, title, date, status, events(name)')
      .eq('status', 'upcoming')
      .order('date', { ascending: true })
      .limit(4),
    supabase.from('activity_log')
      .select('id, action, entity_type, created_at, users(name)')
      .order('created_at', { ascending: false })
      .limit(8),
  ])
  return {
    openBlockers:    openBlockers  ?? 0,
    pendingRequests: pendingRequests ?? 0,
    pendingBudget:   pendingBudget ?? 0,
    totalTasks:      totalTasks  ?? 0,
    doneTasks:       doneTasks   ?? 0,
    milestones:      milestones  ?? [],
    recentActivity:  recentActivity ?? [],
  }
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <Card>
      <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className={`font-display text-3xl font-black ${color}`}>{value}</p>
    </Card>
  )
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const stats = await getDashboardStats()
  const taskPct = stats.totalTasks > 0 ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0

  return (
    <AppShell user={user}>
      <div className="max-w-5xl space-y-6">
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1d3fa0]">
          Dashboard
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Open Blockers"     value={stats.openBlockers}    color={stats.openBlockers > 0    ? 'text-red-600'    : 'text-green-700'} />
          <StatCard label="Pending Resources" value={stats.pendingRequests} color={stats.pendingRequests > 0 ? 'text-[#a07020]'  : 'text-green-700'} />
          <StatCard label="Budget Requests"   value={stats.pendingBudget}   color={stats.pendingBudget > 0   ? 'text-[#a07020]'  : 'text-green-700'} />
          <StatCard label="Task Completion"   value={`${taskPct}%`}         color="text-[#1d3fa0]" />
        </div>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400">Overall Task Progress</p>
            <span className="text-xs font-mono text-slate-500">{stats.doneTasks} / {stats.totalTasks}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#1d3fa0] rounded-full" style={{ width: `${taskPct}%` }} />
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-3">Upcoming Milestones</p>
            {stats.milestones.length === 0 ? (
              <p className="text-sm text-slate-400 font-mono">No upcoming milestones.</p>
            ) : (
              <ul className="space-y-2">
                {(stats.milestones as any[]).map((m) => (
                  <li key={m.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{m.title}</p>
                      <p className="text-xs font-mono text-slate-400">{m.events?.name ?? '—'}</p>
                    </div>
                    <span className="text-xs font-mono text-[#1d3fa0] shrink-0">
                      {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-3">Recent Activity</p>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-slate-400 font-mono">No activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {(stats.recentActivity as any[]).map((a) => (
                  <li key={a.id} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1d3fa0] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-600 leading-snug">
                        <span className="font-semibold">{a.users?.name ?? 'System'}</span>{' '}
                        {a.action} {a.entity_type}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {new Date(a.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
