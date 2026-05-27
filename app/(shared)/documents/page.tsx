import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddDocumentForm } from './AddDocumentForm'

const SCOPE_TYPE_OPTIONS = [
  { value: 'global',      label: 'Global' },
  { value: 'event',       label: 'Event' },
  { value: 'competition', label: 'Competition' },
  { value: 'division',    label: 'Division' },
]

const SCOPE_FILTER_OPTIONS = [
  { value: '',            label: 'All' },
  ...SCOPE_TYPE_OPTIONS,
]

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { scope_type?: string }
}) {
  const supabase = await createClient()

  const scopeFilter = searchParams.scope_type ?? ''

  let query = supabase
    .from('documents')
    .select('id, name, file_url, scope_type, scope_id, created_at, users(name)')
    .order('created_at', { ascending: false })

  if (scopeFilter) {
    query = query.eq('scope_type', scopeFilter)
  }

  const { data } = await query
  const docs = (data ?? []) as any[]

  function fmt(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1d3fa0]">
              Documents
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Scope Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {SCOPE_FILTER_OPTIONS.map((f) => {
            const active = scopeFilter === f.value
            return (
              <a
                key={f.value}
                href={f.value ? `/documents?scope_type=${f.value}` : '/documents'}
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

        {/* Document list */}
        {docs.length === 0 ? (
          <EmptyState icon="📄" title="No documents" description="No documents match this filter." />
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <Card key={doc.id}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {doc.scope_type && (
                        <Badge variant="blue">{doc.scope_type}{doc.scope_id ? ` · ${doc.scope_id}` : ''}</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm leading-snug truncate">{doc.name}</h3>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">
                      {doc.users?.name ?? 'Unknown'} · {fmt(doc.created_at)}
                    </p>
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center font-semibold rounded-xl transition-colors font-body px-3 py-1.5 text-xs bg-transparent hover:bg-[#dce7ff] text-[#1d3fa0] shrink-0 border border-[#dde3ef]"
                  >
                    Open
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add Document inline form */}
        <Card>
          <AddDocumentForm />
        </Card>
      </div>
  )
}
