import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddMeetingNoteForm } from './AddMeetingNoteForm'

export default async function MeetingNotesPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('meeting_notes')
    .select('id, title, body, scope_type, scope_id, attachment_url, created_at, users(name)')
    .order('created_at', { ascending: false })

  const notes = (data ?? []) as any[]

  function fmt(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
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
                  {(note.body || note.attachment_url) && (
                    <div className="mt-3 pt-3 border-t border-[#dde3ef]">
                      {note.body && (
                        <p className="text-sm text-slate-600 font-body leading-relaxed whitespace-pre-wrap">
                          {note.body}
                        </p>
                      )}
                      {note.attachment_url && (
                        <a
                          href={note.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs font-mono text-[#1d3fa0] hover:underline"
                        >
                          📎 Attachment
                        </a>
                      )}
                    </div>
                  )}
                </details>
              </Card>
            ))}
          </div>
        )}

        {/* Add Meeting Note inline form */}
        <Card>
          <AddMeetingNoteForm />
        </Card>
      </div>
  )
}
