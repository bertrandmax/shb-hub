import { getCurrentUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { addVolunteer } from './actions'

const SCOPE_TYPE_OPTIONS = [
  { value: 'global',      label: 'Global' },
  { value: 'event',       label: 'Event' },
  { value: 'competition', label: 'Competition' },
  { value: 'division',    label: 'Division' },
]

export default async function VolunteersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data } = await supabase
    .from('volunteers')
    .select('id, name, role_description, assigned_to_scope_type, assigned_to_scope_id, confirmed, created_at')
    .order('created_at', { ascending: false })

  const volunteers = (data ?? []) as any[]

  return (
    <AppShell user={user}>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1d3fa0]">
              Volunteers
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{volunteers.length} volunteer{volunteers.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Volunteers Table */}
        <Card>
          {volunteers.length === 0 ? (
            <EmptyState icon="🙋" title="No volunteers" description="Add your first volunteer below." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#dde3ef]">
                    <th className="text-left py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Name</th>
                    <th className="text-left py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Role</th>
                    <th className="text-left py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Scope</th>
                    <th className="text-left py-2 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((v) => (
                    <tr key={v.id} className="border-b border-[#dde3ef] last:border-0">
                      <td className="py-3 pr-4 font-semibold text-slate-800">{v.name}</td>
                      <td className="py-3 pr-4 text-slate-600 text-xs">{v.role_description ?? '—'}</td>
                      <td className="py-3 pr-4">
                        {v.assigned_to_scope_type ? (
                          <Badge variant="blue">
                            {v.assigned_to_scope_type}{v.assigned_to_scope_id ? ` · ${v.assigned_to_scope_id}` : ''}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <Badge variant={v.confirmed ? 'green' : 'slate'}>
                          {v.confirmed ? 'Confirmed' : 'Unconfirmed'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Add Volunteer inline form */}
        <Card>
          <details>
            <summary className="cursor-pointer text-xs font-mono font-semibold uppercase tracking-widest text-[#1d3fa0] hover:text-[#1a3690] select-none">
              + Add Volunteer
            </summary>
            <form action={addVolunteer} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Full name"
                  className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Role Description</label>
                <input
                  name="role_description"
                  type="text"
                  placeholder="e.g. Registration desk"
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

              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  name="confirmed"
                  id="confirmed"
                  type="checkbox"
                  className="w-4 h-4 rounded border-[#dde3ef] accent-[#1d3fa0]"
                />
                <label htmlFor="confirmed" className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500 cursor-pointer">
                  Already Confirmed
                </label>
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center font-semibold rounded-xl transition-colors font-body px-4 py-2.5 text-sm bg-[#1d3fa0] hover:bg-[#1a3690] text-white"
                >
                  Add Volunteer
                </button>
              </div>
            </form>
          </details>
        </Card>
      </div>
    </AppShell>
  )
}
