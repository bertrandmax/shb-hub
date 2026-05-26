import { getCurrentUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { createBudgetRequest, approveBudgetRequest, rejectBudgetRequest } from './actions'
import { isProjectManager } from '@/lib/auth/roles'
import { fmtIDR } from '@/lib/format'

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled'

const REQUEST_STATUS_BADGE: Record<RequestStatus, 'gold' | 'green' | 'red' | 'blue'> = {
  pending:   'gold',
  approved:  'green',
  rejected:  'red',
  fulfilled: 'blue',
}

function GapCell({ gap }: { gap: number }) {
  const isPositive = gap >= 0
  return (
    <span className={['font-mono tabular-nums text-sm font-semibold', isPositive ? 'text-green-700' : 'text-red-600'].join(' ')}>
      {isPositive ? '+' : ''}{fmtIDR(gap)}
    </span>
  )
}

export default async function FundsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const isPM = isProjectManager(user.role_type)

  const supabase = await createClient()

  const [{ data: funds }, { data: requests }] = await Promise.all([
    supabase
      .from('funds')
      .select('id, scope_type, scope_id, category, amount_budgeted, amount_received')
      .order('scope_type', { ascending: true }),
    supabase
      .from('budget_requests')
      .select('id, title, amount, reason, requested_by, scope_type, scope_id, status, created_at, users:requested_by(name)')
      .order('created_at', { ascending: false }),
  ])

  const allFunds: any[]    = funds    ?? []
  const allRequests: any[] = requests ?? []

  const scopeGroups = allFunds.reduce<Record<string, any[]>>((acc, f) => {
    const key = f.scope_type
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {})

  const totalBudgeted = allFunds.reduce((sum, f) => sum + (f.amount_budgeted ?? 0), 0)
  const totalReceived = allFunds.reduce((sum, f) => sum + (f.amount_received ?? 0), 0)
  const totalGap      = totalBudgeted - totalReceived

  return (
    <AppShell user={user}>
      <div className="max-w-5xl space-y-8">
        {/* Header */}
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1d3fa0]">
          Funds
        </h1>

        {/* Summary totals */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-0.5">Total Budgeted</p>
            <p className="font-display text-2xl font-black text-[#1d3fa0]">{fmtIDR(totalBudgeted)}</p>
          </Card>
          <Card>
            <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-0.5">Total Received</p>
            <p className="font-display text-2xl font-black text-green-700">{fmtIDR(totalReceived)}</p>
          </Card>
          <Card>
            <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-0.5">Overall Gap</p>
            <p className={['font-display text-2xl font-black', totalGap >= 0 ? 'text-green-700' : 'text-red-600'].join(' ')}>
              {totalGap >= 0 ? '+' : ''}{fmtIDR(totalGap)}
            </p>
          </Card>
        </div>

        {/* Fund Overview */}
        <section className="space-y-4">
          <h2 className="font-display text-base font-black uppercase tracking-tight text-[#1d3fa0]">
            Fund Overview
          </h2>

          {allFunds.length === 0 ? (
            <EmptyState icon="💰" title="No funds" description="No fund records found." />
          ) : (
            Object.entries(scopeGroups).map(([scopeType, items]) => (
              <Card key={scopeType} className="p-0 overflow-hidden">
                <div className="px-4 py-2 bg-[#f0f2f8] border-b border-[#dde3ef]">
                  <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">{scopeType}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#dde3ef]">
                        <th className="text-left px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-slate-400 font-semibold">Category</th>
                        <th className="text-left px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-slate-400 font-semibold">Scope ID</th>
                        <th className="text-right px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-slate-400 font-semibold">Budgeted</th>
                        <th className="text-right px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-slate-400 font-semibold">Received</th>
                        <th className="text-right px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-slate-400 font-semibold">Gap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dde3ef]">
                      {items.map((f: any) => {
                        const gap = (f.amount_budgeted ?? 0) - (f.amount_received ?? 0)
                        return (
                          <tr key={f.id} className="hover:bg-[#f0f2f8]/60 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-800">{f.category}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{f.scope_id ?? '—'}</td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">{fmtIDR(f.amount_budgeted)}</td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">{fmtIDR(f.amount_received)}</td>
                            <td className="px-4 py-3 text-right"><GapCell gap={gap} /></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))
          )}
        </section>

        {/* Budget Requests */}
        <section className="space-y-4">
          <h2 className="font-display text-base font-black uppercase tracking-tight text-[#1d3fa0]">
            Budget Requests
          </h2>

          {/* New Budget Request inline form */}
          <Card>
            <details>
              <summary className="cursor-pointer text-xs font-mono font-semibold uppercase tracking-widest text-[#1d3fa0] hover:text-[#1a3690] select-none">
                + New Request
              </summary>
              <form action={createBudgetRequest} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Title</label>
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="Request title"
                    className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Amount (IDR)</label>
                  <input
                    name="amount"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0"
                    className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Scope Type</label>
                  <select
                    name="scope_type"
                    className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
                  >
                    <option value="">None</option>
                    <option value="global">Global</option>
                    <option value="event">Event</option>
                    <option value="competition">Competition</option>
                    <option value="division">Division</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Scope ID</label>
                  <input
                    name="scope_id"
                    type="text"
                    placeholder="e.g. event UUID"
                    className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Reason</label>
                  <textarea
                    name="reason"
                    rows={3}
                    placeholder="Explain why this budget is needed…"
                    className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 resize-none placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center font-semibold rounded-xl transition-colors font-body px-4 py-2.5 text-sm bg-[#1d3fa0] hover:bg-[#1a3690] text-white"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </details>
          </Card>

          {allRequests.length === 0 ? (
            <EmptyState icon="📋" title="No requests" description="No budget requests have been submitted." />
          ) : (
            <div className="space-y-3">
              {allRequests.map((r: any) => (
                <Card key={r.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant={REQUEST_STATUS_BADGE[r.status as RequestStatus]}>
                          {r.status}
                        </Badge>
                        {r.scope_type && (
                          <span className="text-xs font-mono text-slate-400 uppercase">
                            {r.scope_type}{r.scope_id ? ` · ${r.scope_id}` : ''}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-800 text-sm leading-snug">{r.title}</h3>
                      {r.reason && (
                        <p className="text-xs text-slate-500 font-body mt-1 leading-relaxed">{r.reason}</p>
                      )}
                      <p className="text-[10px] font-mono text-slate-400 mt-2">
                        Requested by {r.users?.name ?? 'unknown'} ·{' '}
                        {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {isPM && r.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <form action={approveBudgetRequest.bind(null, r.id)}>
                            <button type="submit" className="px-3 py-1 text-xs font-mono font-semibold rounded-lg bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 transition-colors">
                              Approve
                            </button>
                          </form>
                          <form action={rejectBudgetRequest.bind(null, r.id)}>
                            <button type="submit" className="px-3 py-1 text-xs font-mono font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors">
                              Reject
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-lg font-black text-[#1d3fa0]">{fmtIDR(r.amount)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
