import { getCurrentUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { addMeetingNote } from './actions'

const SCOPE_TYPE_OPTIONS = [
  { value: 'global',      label: 'Global' },
  { value: 'event',       label: 'Event' },
  { value: 'competition', label: 'Competition' },
  { value: 'division',    label: 'Division' },
]

export default async function MeetingNotesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data } = await supabase
    .from('meeting_notes')
    .select('id, title, body, scope_type, scope_id, created_at, users(name)')
    .order('created_at', { ascending: false })

  const notes = (data ?? []) as any[]

  function fmt(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <AppShell user={user}>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1d3fa0]">
              Meeting Notes
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Notes List */}
        {notes.length === 0 ? (
          <EmptyState icon="📝" title="No meeting notes" description="Add your first meeting note below." />
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <Card key={note.id}>
                <details>
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {note.scope_type && (
                            <Badge variant="blue">
                              {note.scope_type}{note.scope_id ? ` · ${note.scope_id}` : ''}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-800 text-sm leading-snug">{note.title}</h3>
                        <p className="text-[10px] font-mono text-slate-400 mt-1">
                          {note.users?.name ?? 'Unknown'} · {fmt(note.created_at)}
                        </p>
                      </div>
                      <span className="text-xs font-mono text-[#1d3fa0] shrink-0 select-none pt-0.5">
                        expand
                      </span>
                    </div>
                  </summary>
                  {note.body && (
                    <div className="mt-3 pt-3 border-t border-[#dde3ef]">
                      <p className="text-sm text-slate-600 font-body leading-relaxed whitespace-pre-wrap">
                        {note.body}
                      </p>
                    </div>
                  )}
                </details>
              </Card>
            ))}
          </div>
        )}

        {/* Add Meeting Note inline form */}
        <Card>
          <details>
            <summary className="cursor-pointer text-xs font-mono font-semibold uppercase tracking-widest text-[#1d3fa0] hover:text-[#1a3690] select-none">
              + Add Meeting Note
            </summary>
            <form action={addMeetingNote} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Title</label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Weekly Sync – 20 May 2026"
                  className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
                />
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Notes</label>
                <textarea
                  name="body"
                  rows={5}
                  placeholder="Meeting notes, decisions, action items…"
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
                  Save Note
                </button>
              </div>
            </form>
          </details>
        </Card>
      </div>
    </AppShell>
  )
}
