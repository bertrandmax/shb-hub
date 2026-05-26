import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { createContentPost } from './actions'

type Platform = 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'other'
type PostStatus = 'draft' | 'scheduled' | 'published'

const PLATFORM_VARIANTS: Record<Platform, 'red' | 'slate' | 'blue'> = {
  instagram: 'red',
  tiktok:    'slate',
  facebook:  'blue',
  twitter:   'blue',
  other:     'slate',
}

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok:    'TikTok',
  facebook:  'Facebook',
  twitter:   'Twitter / X',
  other:     'Other',
}

const STATUS_VARIANTS: Record<PostStatus, 'slate' | 'gold' | 'green'> = {
  draft:     'slate',
  scheduled: 'gold',
  published: 'green',
}

const STATUS_LABELS: Record<PostStatus, string> = {
  draft:     'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '',          label: 'All' },
  { value: 'draft',     label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
]

const PLATFORM_FILTERS: { value: string; label: string }[] = [
  { value: '',          label: 'All' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok',    label: 'TikTok' },
  { value: 'facebook',  label: 'Facebook' },
  { value: 'twitter',   label: 'Twitter' },
  { value: 'other',     label: 'Other' },
]

export default async function ContentCalendarPage({
  searchParams,
}: {
  searchParams: { status?: string; platform?: string }
}) {
  const supabase = await createClient()

  const statusFilter   = searchParams.status   ?? ''
  const platformFilter = searchParams.platform ?? ''

  let query = supabase
    .from('content_calendar_posts')
    .select('id, platform, title, caption, scheduled_at, status, events(name)')
    .order('scheduled_at', { ascending: false })

  if (statusFilter)   query = query.eq('status',   statusFilter)
  if (platformFilter) query = query.eq('platform', platformFilter)

  const { data } = await query

  const posts = (data ?? []) as any[]

  function buildHref(newStatus: string, newPlatform: string) {
    const params = new URLSearchParams()
    if (newStatus)   params.set('status',   newStatus)
    if (newPlatform) params.set('platform', newPlatform)
    const qs = params.toString()
    return qs ? `/content-calendar?${qs}` : '/content-calendar'
  }

  function fmtDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  function fmtTime(d: string | null) {
    if (!d) return ''
    return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const pillBase = 'px-3 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wide transition-colors'
  const pillActive = 'bg-[#1d3fa0] text-white'
  const pillInactive = 'bg-white border border-[#dde3ef] text-slate-500 hover:border-[#1d3fa0] hover:text-[#1d3fa0]'

  return (
    <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1d3fa0]">
              Content Calendar
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="space-y-2">
          {/* Status filters */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mr-1">Status</span>
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.value
              return (
                <a
                  key={f.value}
                  href={buildHref(f.value, platformFilter)}
                  className={`${pillBase} ${active ? pillActive : pillInactive}`}
                >
                  {f.label}
                </a>
              )
            })}
          </div>

          {/* Platform filters */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mr-1">Platform</span>
            {PLATFORM_FILTERS.map((f) => {
              const active = platformFilter === f.value
              return (
                <a
                  key={f.value}
                  href={buildHref(statusFilter, f.value)}
                  className={`${pillBase} ${active ? pillActive : pillInactive}`}
                >
                  {f.label}
                </a>
              )
            })}
          </div>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <EmptyState icon="📅" title="No posts" description="No content calendar posts match this filter." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => {
              const platform = post.platform as Platform
              const status   = post.status as PostStatus
              return (
                <Card key={post.id} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={PLATFORM_VARIANTS[platform] ?? 'slate'}>
                      {PLATFORM_LABELS[platform] ?? platform}
                    </Badge>
                    <Badge variant={STATUS_VARIANTS[status] ?? 'slate'}>
                      {STATUS_LABELS[status] ?? status}
                    </Badge>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">{post.title}</h3>
                    {post.caption && (
                      <p className="text-xs text-slate-500 font-body mt-1 leading-relaxed line-clamp-3">{post.caption}</p>
                    )}
                  </div>

                  <div className="border-t border-[#dde3ef] pt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-400 truncate">
                      {post.events?.name ?? 'No event'}
                    </span>
                    <span className="text-[10px] font-mono text-[#1d3fa0] shrink-0">
                      {fmtDate(post.scheduled_at)}
                      {post.scheduled_at && (
                        <span className="text-slate-400"> · {fmtTime(post.scheduled_at)}</span>
                      )}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Add Post inline form */}
        <Card>
          <details>
            <summary className="cursor-pointer text-xs font-mono font-semibold uppercase tracking-widest text-[#1d3fa0] hover:text-[#1a3690] select-none">
              + Add Post
            </summary>
            <form action={createContentPost} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Platform</label>
                <select
                  name="platform"
                  required
                  className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
                >
                  <option value="">Select platform…</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Status</label>
                <select
                  name="status"
                  defaultValue="draft"
                  className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Title</label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="Post title"
                  className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
                />
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Caption</label>
                <textarea
                  name="caption"
                  rows={3}
                  placeholder="Write your caption…"
                  className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 resize-none placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Scheduled At</label>
                <input
                  name="scheduled_at"
                  type="datetime-local"
                  className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center font-semibold rounded-xl transition-colors font-body px-4 py-2.5 text-sm bg-[#1d3fa0] hover:bg-[#1a3690] text-white"
                >
                  Add Post
                </button>
              </div>
            </form>
          </details>
        </Card>
      </div>
  )
}
