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
    { count: overdueFollowups },
    { data: milestones },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('blockers').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('resource_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('budget_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done'),
    supabase
      .from('sponsors')
      .select('*', { count: 'exact', head: true })
      .lt('next_followup_date', new Date().toISOString().split('T')[0])
      .neq('status', 'declined'),
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
    openBlockers:     openBlockers     ?? 0,
    pendingRequests:  pendingRequests  ?? 0,
    pendingBudget:    pendingBudget    ?? 0,
    totalTasks:       totalTasks       ?? 0,
    doneTasks:        doneTasks        ?? 0,
    overdueFollowups: overdueFollowups ?? 0,
    milestones:       milestones       ?? [],
    recentActivity:   recentActivity   ?? [],
  }
}

function StatCard({
  label,
  value,
  accent,
  sub,
}: {
  label: string
  value: number | string
  accent: 'blue' | 'red' | 'gold' | 'green'
  sub?: string
}) {
  const accentCls = {
    blue:  'bg-[#1d3fa0]',
    red:   'bg-red-500',
    gold:  'bg-[#a07020]',
    green: 'bg-emerald-500',
  }[accent]

  const valueCls = {
    blue:  'text-[#1d3fa0]',
    red:   'text-red-600',
    gold:  'text-[#a07020]',
    green: 'text-emerald-700',
  }[accent]

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentCls}`} />
      <p className="text-[10px] font-mono font-medium uppercase tracking-widest text-slate-400 mb-2">{label}</p>
      <p className={`font-display text-3xl font-black leading-none ${valueCls}`}>{value}</p>
      {sub && <p className="text-[10px] font-mono text-slate-400 mt-1">{sub}</p>}
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
      <div className="max-w-5xl space-y-5">
        <div className="animate-fade-up stagger-1">
          <h1 className="font-display text-xl font-black uppercase tracking-tight text-[#1d3fa0]">
            Dashboard
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Overview · SHB Competition Hub</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-up stagger-2">
          <StatCard
            label="Open Blockers"
            value={stats.openBlockers}
            accent={stats.openBlockers > 0 ? 'red' : 'green'}
          />
          <StatCard
            label="Pending Resources"
            value={stats.pendingRequests}
            accent={stats.pendingRequests > 0 ? 'gold' : 'green'}
          />
          <StatCard
            label="Budget Requests"
            value={stats.pendingBudget}
            accent={stats.pendingBudget > 0 ? 'gold' : 'green'}
          />
          <StatCard
            label="Task Completion"
            value={`${taskPct}%`}
            accent="blue"
            sub={`${stats.doneTasks} of ${stats.totalTasks} done`}
          />
        </div>

        {stats.overdueFollowups > 0 && (
          <div className="animate-fade-up stagger-2">
            <StatCard
              label="Sponsor Follow-ups Due"
              value={stats.overdueFollowups}
              accent="gold"
            />
          </div>
        )}

        <div className="animate-fade-up stagger-3">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-mono font-medium uppercase tracking-widest text-slate-400">Overall Task Progress</p>
              <span className="text-xs font-mono font-semibold text-[#1d3fa0]">{stats.doneTasks} / {stats.totalTasks}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1d3fa0] to-[#3b60d0] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${taskPct}%` }}
              />
            </div>
          </Card>
        </div>

        <div className="animate-fade-up stagger-3">
          <Card>
            <p className="text-[10px] font-mono font-medium uppercase tracking-widest text-slate-400 mb-3">
              Quick Actions
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { href: '/blockers',  label: 'Flag Blocker',       accent: 'border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300' },
                { href: '/resources', label: 'Resource Request',   accent: 'border-[#dde3ef] text-slate-600 hover:border-[#1d3fa0] hover:text-[#1d3fa0] hover:bg-blue-light/40' },
                { href: '/funds',     label: 'Budget Request',     accent: 'border-[#dde3ef] text-slate-600 hover:border-[#1d3fa0] hover:text-[#1d3fa0] hover:bg-blue-light/40' },
                { href: '/sponsors',  label: 'View Follow-ups →',  accent: 'border-[#dde3ef] text-slate-600 hover:border-[#a07020] hover:text-[#a07020] hover:bg-[#fdf3d8]/60' },
              ].map(({ href, label, accent }) => (
                <a
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all duration-150 active:scale-[0.97] ${accent}`}
                >
                  {label}
                </a>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-up stagger-4">
          <Card>
            <p className="text-[10px] font-mono font-medium uppercase tracking-widest text-slate-400 mb-3">
              Upcoming Milestones
            </p>
            {stats.milestones.length === 0 ? (
              <p className="text-sm text-slate-300 font-mono py-4 text-center">No upcoming milestones.</p>
            ) : (
              <ul className="space-y-3">
                {(stats.milestones as any[]).map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{m.title}</p>
                      <p className="text-[10px] font-mono text-slate-400">{m.events?.name ?? '—'}</p>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#1d3fa0] bg-blue-light/60 px-2 py-0.5 rounded shrink-0">
                      {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <p className="text-[10px] font-mono font-medium uppercase tracking-widest text-slate-400 mb-3">
              Recent Activity
            </p>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-slate-300 font-mono py-4 text-center">No activity yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {(stats.recentActivity as any[]).map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1d3fa0]/40 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-600 leading-snug">
                        <span className="font-semibold text-slate-700">{a.users?.name ?? 'System'}</span>
                        {' '}{a.action} {a.entity_type}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
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
