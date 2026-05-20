import { getCurrentUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

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

export default async function ContentCalendarPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data } = await supabase
    .from('content_calendar_posts')
    .select('id, platform, title, caption, scheduled_at, status, events(name)')
    .order('scheduled_at', { ascending: false })

  const posts = (data ?? []) as any[]

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

  return (
    <AppShell user={user}>
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

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <EmptyState icon="📅" title="No posts" description="No content calendar posts yet." />
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
      </div>
    </AppShell>
  )
}
