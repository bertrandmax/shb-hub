import { getCurrentUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { createResourceRequest } from './actions'

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled'

const STATUS_LABELS: Record<RequestStatus, string> = {
  pending:   'Pending',
  approved:  'Approved',
  rejected:  'Rejected',
  fulfilled: 'Fulfilled',
}

const STATUS_VARIANTS: Record<RequestStatus, 'gold' | 'green' | 'red' | 'slate'> = {
  pending:   'gold',
  approved:  'green',
  rejected:  'red',
  fulfilled: 'slate',
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '',          label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'approved',  label: 'Approved' },
  { value: 'rejected',  label: 'Rejected' },
  { value: 'fulfilled', label: 'Fulfilled' },
]

const SCOPE_TYPE_OPTIONS = [
  { value: 'global',      label: 'Global' },
  { value: 'event',       label: 'Event' },
  { value: 'competition', label: 'Competition' },
  { value: 'division',    label: 'Division' },
]

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const statusFilter = searchParams.status ?? ''

  let query = supabase
    .from('resource_requests')
    .select('id, title, description, status, scope_type, scope_id, created_at, users(name)')
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data } = await query
  const requests = (data ?? []) as any[]

  function fmt(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <AppShell user={user}>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1d3fa0]">
            Resource Requests
          </h1>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.value
            return (
              <a
                key={f.value}
                href={f.value ? `/resources?status=${f.value}` : '/resources'}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wide transition-colors ${
                  active
                    ? 'bg-[#1d3fa0] text-white'
                    : 'bg-white border border-[#dde3ef] text-slate-500 hover:border-[#1d3fa0] hover:text-[#1d3fa0]'
                }`}
              >
                {f.label}
              </a>
            )
          })}
        </div>

        {/* Requests */}
        {requests.length === 0 ? (
          <EmptyState icon="📋" title="No requests" description="No resource requests match this filter." />
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const status = req.status as RequestStatus
              return (
                <Card key={req.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant={STATUS_VARIANTS[status] ?? 'slate'}>
                          {STATUS_LABELS[status] ?? status}
                        </Badge>
                        {req.scope_type && (
                          <Badge variant="slate">{req.scope_type}{req.scope_id ? ` · ${req.scope_id}` : ''}</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-800 text-sm leading-snug">{req.title}</h3>
                      {req.description && (
                        <p className="text-xs text-slate-500 font-body mt-1 leading-relaxed">{req.description}</p>
                      )}
                      <p className="text-[10px] font-mono text-slate-400 mt-2">
                        {req.users?.name ?? 'Unknown'} · {fmt(req.created_at)}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* New Request inline form */}
        <Card>
          <details>
            <summary className="cursor-pointer text-xs font-mono font-semibold uppercase tracking-widest text-[#1d3fa0] hover:text-[#1a3690] select-none">
              + New Request
            </summary>
            <form action={createResourceRequest} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Title</label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="Resource title"
                  className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
                />
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Describe what you need and why…"
                  className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 resize-none placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Scope Type</label>
                <select
                  name="scope_type"
                  className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
                >
                  <option value="">None</option>
                  {SCOPE_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Scope ID</label>
                <input
                  name="scope_id"
                  type="text"
                  placeholder="e.g. event UUID"
                  className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
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
      </div>
    </AppShell>
  )
}
