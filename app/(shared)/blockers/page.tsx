import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { flagBlocker } from './actions'
import { BlockerStatusSelect } from './BlockerStatusSelect'

type BlockerStatus   = 'open' | 'in_progress' | 'resolved'
type BlockerPriority = 'low' | 'medium' | 'high'

const STATUS_BADGE: Record<BlockerStatus, 'red' | 'gold' | 'green'> = {
  open:        'red',
  in_progress: 'gold',
  resolved:    'green',
}

const PRIORITY_BADGE: Record<BlockerPriority, 'red' | 'gold' | 'slate'> = {
  high:   'red',
  medium: 'gold',
  low:    'slate',
}

const STATUS_LABEL: Record<BlockerStatus, string> = {
  open:        'Open',
  in_progress: 'In Progress',
  resolved:    'Resolved',
}

const STATUS_FILTERS = [
  { value: 'all',         label: 'All' },
  { value: 'open',        label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved',    label: 'Resolved' },
]

const PRIORITY_FILTERS = [
  { value: 'all',    label: 'All Priorities' },
  { value: 'high',   label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low' },
]

const STATUS_ORDER: Record<BlockerStatus, number>   = { open: 0, in_progress: 1, resolved: 2 }
const PRIORITY_ORDER: Record<BlockerPriority, number> = { high: 0, medium: 1, low: 2 }

export default async function BlockersPage({
  searchParams,
}: {
  searchParams: { status?: string; priority?: string }
}) {
  const supabase = await createClient()
  const { data: blockers } = await supabase
    .from('blockers')
    .select('id, title, description, flagged_by, status, priority, scope_type, scope_id, created_at, users:flagged_by(name)')
    .order('created_at', { ascending: false })

  const sorted: any[] = (blockers ?? []).sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status as BlockerStatus] - STATUS_ORDER[b.status as BlockerStatus]
    if (statusDiff !== 0) return statusDiff
    return PRIORITY_ORDER[a.priority as BlockerPriority] - PRIORITY_ORDER[b.priority as BlockerPriority]
  })

  const activeStatus   = searchParams.status   && searchParams.status   !== 'all' ? searchParams.status   : null
  const activePriority = searchParams.priority && searchParams.priority !== 'all' ? searchParams.priority : null

  const filtered = sorted.filter(b => {
    if (activeStatus   && b.status   !== activeStatus)   return false
    if (activePriority && b.priority !== activePriority) return false
    return true
  })

  function filterHref(status: string | null, priority: string | null) {
    const params = new URLSearchParams()
    if (status   && status   !== 'all') params.set('status',   status)
    if (priority && priority !== 'all') params.set('priority', priority)
    const qs = params.toString()
    return qs ? `/blockers?${qs}` : '/blockers'
  }

  return (
    <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1d3fa0]">
              Blockers
            </h1>
            <Badge variant="red">{sorted.filter(b => b.status === 'open').length} open</Badge>
          </div>
        </div>

        {/* Flag Blocker form */}
        <details className="group">
          <summary className="list-none cursor-pointer">
            <Button size="sm" variant="danger" className="select-none">+ Flag Blocker</Button>
          </summary>
          <Card className="mt-3">
            <form action={flagBlocker} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  name="title"
                  label="Title"
                  placeholder="Briefly describe the blocker"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  name="description"
                  label="Description"
                  rows={3}
                  placeholder="More detail about what's blocked and why…"
                />
              </div>
              <Select
                name="priority"
                label="Priority"
                defaultValue="medium"
                options={[
                  { value: 'high',   label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low',    label: 'Low' },
                ]}
              />
              <Select
                name="scope_type"
                label="Scope Type"
                defaultValue="global"
                options={[
                  { value: 'global',   label: 'Global' },
                  { value: 'event',    label: 'Event' },
                  { value: 'division', label: 'Division' },
                ]}
              />
              <Input
                name="scope_id"
                label="Scope ID"
                placeholder="Leave blank for global"
              />
              <div className="flex items-end justify-end">
                <Button type="submit" size="sm" variant="danger">Submit Blocker</Button>
              </div>
            </form>
          </Card>
        </details>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(opt => (
              <a
                key={opt.value}
                href={filterHref(opt.value, searchParams.priority ?? 'all')}
                className={[
                  'px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wide border transition-colors',
                  (activeStatus ?? 'all') === opt.value
                    ? 'bg-[#1d3fa0] text-white border-[#1d3fa0]'
                    : 'bg-white text-slate-500 border-[#dde3ef] hover:border-[#1d3fa0] hover:text-[#1d3fa0]',
                ].join(' ')}
              >
                {opt.label}
              </a>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {PRIORITY_FILTERS.map(opt => (
              <a
                key={opt.value}
                href={filterHref(searchParams.status ?? 'all', opt.value)}
                className={[
                  'px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wide border transition-colors',
                  (activePriority ?? 'all') === opt.value
                    ? 'bg-[#a07020] text-white border-[#a07020]'
                    : 'bg-white text-slate-500 border-[#dde3ef] hover:border-[#a07020] hover:text-[#a07020]',
                ].join(' ')}
              >
                {opt.label}
              </a>
            ))}
          </div>
        </div>

        {/* Blockers list */}
        {filtered.length === 0 ? (
          <EmptyState icon="🚧" title="No blockers" description="No blockers match the current filters." />
        ) : (
          <div className="space-y-3">
            {filtered.map((b: any) => (
              <Card key={b.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant={PRIORITY_BADGE[b.priority as BlockerPriority]}>{b.priority}</Badge>
                      <Badge variant={STATUS_BADGE[b.status as BlockerStatus]}>
                        {STATUS_LABEL[b.status as BlockerStatus]}
                      </Badge>
                      {b.scope_type && b.scope_type !== 'global' && (
                        <span className="text-xs font-mono text-slate-400 uppercase">
                          {b.scope_type}{b.scope_id ? ` · ${b.scope_id}` : ''}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm leading-snug">{b.title}</h3>
                    {b.description && (
                      <p className="text-xs text-slate-500 font-body mt-1 leading-relaxed">{b.description}</p>
                    )}
                    <p className="text-[10px] font-mono text-slate-400 mt-2">
                      Flagged by {b.users?.name ?? 'unknown'} ·{' '}
                      {new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <BlockerStatusSelect id={b.id} currentStatus={b.status} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
  )
}
