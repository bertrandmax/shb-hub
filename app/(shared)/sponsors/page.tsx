import { getCurrentUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { isProjectManager } from '@/lib/auth/roles'
import { addSponsor } from './actions'
import { SponsorStatusSelect } from './SponsorStatusSelect'
import { SponsorRow } from './SponsorRow'
import { fmtMYR } from '@/lib/format'

type SponsorStatus = 'prospect' | 'contacted' | 'committed' | 'declined'

const STATUS_ORDER: Record<SponsorStatus, number> = {
  committed: 0,
  contacted: 1,
  prospect:  2,
  declined:  3,
}

const STATUS_BADGE: Record<SponsorStatus, 'green' | 'blue' | 'gold' | 'red'> = {
  committed: 'green',
  contacted: 'blue',
  prospect:  'gold',
  declined:  'red',
}

const FILTER_OPTIONS = [
  { value: 'all',       label: 'All' },
  { value: 'prospect',  label: 'Prospect' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'committed', label: 'Committed' },
  { value: 'declined',  label: 'Declined' },
]

export default async function SponsorsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const user = (await getCurrentUser())!

  const supabase = await createClient()

  const [{ data: sponsors }, { data: allInteractions }, { data: allDeliverables }] = await Promise.all([
    supabase
      .from('sponsors')
      .select('id, company_name, contact_name, contact_email, status, amount_pledged, amount_received, next_followup_date, notes, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('sponsor_interactions')
      .select('id, sponsor_id, interaction_type, notes, date, users(name)')
      .order('date', { ascending: false }),
    supabase
      .from('sponsor_deliverables')
      .select('id, sponsor_id, description, type, status, due_date')
      .order('created_at', { ascending: true }),
  ])

  const allSponsors: any[] = (sponsors ?? []).sort(
    (a, b) => STATUS_ORDER[a.status as SponsorStatus] - STATUS_ORDER[b.status as SponsorStatus],
  )

  const interactionsBySponsor = (allInteractions ?? []).reduce<Record<string, any[]>>((acc, i) => {
    acc[i.sponsor_id] = [...(acc[i.sponsor_id] ?? []), i]
    return acc
  }, {})

  const deliverablesBySponsor = (allDeliverables ?? []).reduce<Record<string, any[]>>((acc, d) => {
    acc[d.sponsor_id] = [...(acc[d.sponsor_id] ?? []), d]
    return acc
  }, {})

  const activeFilter = searchParams.status && searchParams.status !== 'all' ? searchParams.status : null
  const filtered = activeFilter ? allSponsors.filter(s => s.status === activeFilter) : allSponsors

  const totalPledged  = allSponsors.reduce((sum, s) => sum + (s.amount_pledged  ?? 0), 0)
  const totalReceived = allSponsors.reduce((sum, s) => sum + (s.amount_received ?? 0), 0)

  const isPM   = isProjectManager(user.role_type)
  const isMktg = user.role_type === 'marketing_head'
  const canAdd = isPM || isMktg
  const canLog = isPM || isMktg || ['shb_cup_pm', '5k_run_pm'].includes(user.role_type)

  return (
      <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1d3fa0]">
              Sponsors
            </h1>
            <Badge variant="blue">{allSponsors.length}</Badge>
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="flex items-center gap-4">
            <div>
              <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-0.5">Total Pledged</p>
              <p className="font-display text-2xl font-black text-[#1d3fa0]">{fmtMYR(totalPledged)}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div>
              <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-0.5">Total Received</p>
              <p className="font-display text-2xl font-black text-green-700">{fmtMYR(totalReceived)}</p>
            </div>
          </Card>
        </div>

        {/* Add Sponsor (PM or Marketing Head) */}
        {canAdd && (
          <details className="group">
            <summary className="list-none cursor-pointer">
              <Button size="sm" className="select-none">+ Add Sponsor</Button>
            </summary>
            <Card className="mt-3">
              <form action={addSponsor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name="company_name"
                  label="Company Name"
                  placeholder="Acme Corp"
                  required
                />
                <Input
                  name="contact_name"
                  label="Contact Name"
                  placeholder="Jane Doe"
                />
                <Input
                  name="contact_email"
                  label="Contact Email"
                  type="email"
                  placeholder="jane@acme.com"
                />
                <Select
                  name="status"
                  label="Status"
                  defaultValue="prospect"
                  options={[
                    { value: 'prospect',  label: 'Prospect' },
                    { value: 'contacted', label: 'Contacted' },
                    { value: 'committed', label: 'Committed' },
                    { value: 'declined',  label: 'Declined' },
                  ]}
                />
                <Input
                  name="amount_pledged"
                  label="Amount Pledged (MYR)"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                />
                <Input
                  name="next_followup_date"
                  label="Next Follow-up"
                  type="date"
                />
                <div className="md:col-span-2">
                  <Input
                    name="notes"
                    label="Notes"
                    placeholder="Optional notes…"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" size="sm">Save Sponsor</Button>
                </div>
              </form>
            </Card>
          </details>
        )}

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map(opt => (
            <a
              key={opt.value}
              href={opt.value === 'all' ? '/sponsors' : `/sponsors?status=${opt.value}`}
              className={[
                'px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wide border transition-colors',
                (activeFilter ?? 'all') === opt.value
                  ? 'bg-[#1d3fa0] text-white border-[#1d3fa0]'
                  : 'bg-white text-slate-500 border-[#dde3ef] hover:border-[#1d3fa0] hover:text-[#1d3fa0]',
              ].join(' ')}
            >
              {opt.label}
            </a>
          ))}
        </div>

        {/* Table */}
        <Card className="p-0 overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon="🤝" title="No sponsors" description="No sponsors match the current filter." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#dde3ef] bg-[#f0f2f8]">
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest text-slate-500 font-semibold">Company</th>
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest text-slate-500 font-semibold">Contact</th>
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest text-slate-500 font-semibold">Status</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase tracking-widest text-slate-500 font-semibold">Pledged</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase tracking-widest text-slate-500 font-semibold">Received</th>
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest text-slate-500 font-semibold">Next Follow-up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dde3ef]">
                  {filtered.map((s: any) => (
                    <SponsorRow
                      key={s.id}
                      sponsor={s}
                      interactions={interactionsBySponsor[s.id] ?? []}
                      deliverables={deliverablesBySponsor[s.id] ?? []}
                      isPM={isPM}
                      canLog={canLog}
                      statusCell={
                        isPM
                          ? <SponsorStatusSelect id={s.id} currentStatus={s.status} />
                          : <Badge variant={STATUS_BADGE[s.status as SponsorStatus]}>{s.status}</Badge>
                      }
                      fmtAmount={fmtMYR}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
  )
}
