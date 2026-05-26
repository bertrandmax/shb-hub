import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

import { fmtIDR } from '@/lib/format'

async function getReportData() {
  const supabase = await createClient()

  const [
    { data: sponsors },
    { data: tasks },
    { data: blockers },
    { data: funds },
  ] = await Promise.all([
    supabase.from('sponsors').select('id, status, amount_pledged, amount_received'),
    supabase.from('tasks').select('id, status'),
    supabase.from('blockers').select('id, status, priority'),
    supabase.from('funds').select('id, amount_budgeted, amount_received'),
  ])

  return {
    sponsors: (sponsors ?? []) as any[],
    tasks:    (tasks    ?? []) as any[],
    blockers: (blockers ?? []) as any[],
    funds:    (funds    ?? []) as any[],
  }
}

export default async function ReportsPage() {
  const { sponsors, tasks, blockers, funds } = await getReportData()

  // ── Sponsor summary ─────────────────────────────────────────────────────────
  const totalPledged  = sponsors.reduce((s: number, sp: any) => s + (sp.amount_pledged   ?? 0), 0)
  const totalReceived = sponsors.reduce((s: number, sp: any) => s + (sp.amount_received  ?? 0), 0)

  const sponsorByStatus = sponsors.reduce((acc: Record<string, number>, sp: any) => {
    acc[sp.status] = (acc[sp.status] ?? 0) + 1
    return acc
  }, {})

  // ── Task summary ─────────────────────────────────────────────────────────────
  const taskByStatus = tasks.reduce((acc: Record<string, number>, t: any) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1
    return acc
  }, {})

  // ── Blocker summary ──────────────────────────────────────────────────────────
  const blockerByStatus = blockers.reduce((acc: Record<string, number>, b: any) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1
    return acc
  }, {})

  const blockerByPriority = blockers.reduce((acc: Record<string, number>, b: any) => {
    acc[b.priority] = (acc[b.priority] ?? 0) + 1
    return acc
  }, {})

  // ── Fund summary ─────────────────────────────────────────────────────────────
  const totalBudgeted     = funds.reduce((s: number, f: any) => s + (f.amount_budgeted  ?? 0), 0)
  const totalFundsReceived = funds.reduce((s: number, f: any) => s + (f.amount_received ?? 0), 0)
  const fundGap           = totalBudgeted - totalFundsReceived

  const SPONSOR_STATUS_VARIANTS: Record<string, 'gold' | 'green' | 'red' | 'slate'> = {
    prospect:  'slate',
    contacted: 'gold',
    confirmed: 'green',
    declined:  'red',
  }

  const TASK_STATUS_VARIANTS: Record<string, 'slate' | 'gold' | 'green'> = {
    todo:        'slate',
    in_progress: 'gold',
    done:        'green',
  }

  const BLOCKER_STATUS_VARIANTS: Record<string, 'red' | 'gold' | 'green' | 'slate'> = {
    open:        'red',
    in_progress: 'gold',
    resolved:    'green',
  }

  const PRIORITY_VARIANTS: Record<string, 'red' | 'gold' | 'slate'> = {
    high:   'red',
    medium: 'gold',
    low:    'slate',
  }

  return (
    <div className="max-w-5xl space-y-8">
        {/* Header */}
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1d3fa0]">
          Reports
        </h1>

        {/* ── Sponsor Summary ───────────────────────────────────────────────── */}
        <section className="space-y-3">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-400">Sponsor Summary</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-1">Total Pledged</p>
              <p className="font-display text-2xl font-black text-[#1d3fa0]">{fmtIDR(totalPledged)}</p>
            </Card>
            <Card>
              <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-1">Total Received</p>
              <p className="font-display text-2xl font-black text-green-700">{fmtIDR(totalReceived)}</p>
            </Card>
            <Card>
              <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-1">Outstanding</p>
              <p className={`font-display text-2xl font-black ${totalPledged - totalReceived > 0 ? 'text-[#a07020]' : 'text-green-700'}`}>
                {fmtIDR(totalPledged - totalReceived)}
              </p>
            </Card>
          </div>
          <Card>
            <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-3">By Status</p>
            {Object.keys(sponsorByStatus).length === 0 ? (
              <p className="text-xs text-slate-400 font-mono">No sponsors yet.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {Object.entries(sponsorByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2">
                    <Badge variant={SPONSOR_STATUS_VARIANTS[status] ?? 'slate'}>{status}</Badge>
                    <span className="font-mono text-sm font-semibold text-slate-700">{count as number}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* ── Task Summary ─────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-400">Task Summary</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['todo', 'in_progress', 'done'] as const).map((status) => {
              const labels: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
              const count = taskByStatus[status] ?? 0
              return (
                <Card key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400">{labels[status]}</p>
                    <Badge variant={TASK_STATUS_VARIANTS[status]}>{status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="font-display text-3xl font-black text-slate-800">{count}</p>
                </Card>
              )
            })}
          </div>
          {tasks.length > 0 && (
            <Card>
              <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-2">
                Overall Completion
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1d3fa0] rounded-full"
                    style={{ width: `${Math.round(((taskByStatus['done'] ?? 0) / tasks.length) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-mono font-semibold text-[#1d3fa0] shrink-0">
                  {Math.round(((taskByStatus['done'] ?? 0) / tasks.length) * 100)}%
                </span>
              </div>
            </Card>
          )}
        </section>

        {/* ── Blocker Summary ───────────────────────────────────────────────── */}
        <section className="space-y-3">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-400">Blocker Summary</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-3">By Status</p>
              {Object.keys(blockerByStatus).length === 0 ? (
                <p className="text-xs text-slate-400 font-mono">No blockers.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(blockerByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <Badge variant={BLOCKER_STATUS_VARIANTS[status as keyof typeof BLOCKER_STATUS_VARIANTS] ?? 'slate'}>
                        {status.replace('_', ' ')}
                      </Badge>
                      <span className="font-mono text-sm font-semibold text-slate-700">{count as number}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card>
              <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-3">By Priority</p>
              {Object.keys(blockerByPriority).length === 0 ? (
                <p className="text-xs text-slate-400 font-mono">No blockers.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(blockerByPriority).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <Badge variant={PRIORITY_VARIANTS[priority as keyof typeof PRIORITY_VARIANTS] ?? 'slate'}>
                        {priority}
                      </Badge>
                      <span className="font-mono text-sm font-semibold text-slate-700">{count as number}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </section>

        {/* ── Fund Summary ──────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-400">Fund Summary</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-1">Total Budgeted</p>
              <p className="font-display text-2xl font-black text-[#1d3fa0]">{fmtIDR(totalBudgeted)}</p>
            </Card>
            <Card>
              <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-1">Total Received</p>
              <p className="font-display text-2xl font-black text-green-700">{fmtIDR(totalFundsReceived)}</p>
            </Card>
            <Card>
              <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-1">Gap</p>
              <p className={`font-display text-2xl font-black ${fundGap > 0 ? 'text-[#a07020]' : 'text-green-700'}`}>
                {fmtIDR(Math.abs(fundGap))}
                {fundGap < 0 && <span className="text-xs font-body font-normal text-green-600 ml-1">surplus</span>}
              </p>
            </Card>
          </div>
          {funds.length > 0 && totalBudgeted > 0 && (
            <Card>
              <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-2">
                Funding Coverage
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((totalFundsReceived / totalBudgeted) * 100))}%` }}
                  />
                </div>
                <span className="text-sm font-mono font-semibold text-green-700 shrink-0">
                  {Math.min(100, Math.round((totalFundsReceived / totalBudgeted) * 100))}%
                </span>
              </div>
            </Card>
          )}
        </section>
      </div>
  )
}
