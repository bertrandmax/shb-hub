import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

type EventStatus = 'upcoming' | 'active' | 'completed'
type DivisionType = 'marketing' | 'central_support' | 'run' | 'shared'
type TaskStatus = 'todo' | 'in_progress' | 'done'

interface Division {
  id: string
  name: string
  type: DivisionType
}

interface RunPageData {
  event: { id: string; name: string; status: EventStatus } | null
  divisions: Division[]
  totalTasks: number
  doneTasks: number
  volunteerCount: number
}

async function getRunData(): Promise<RunPageData> {
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, name, status')
    .eq('name', '5k_run')
    .single()

  if (!event) {
    return { event: null, divisions: [], totalTasks: 0, doneTasks: 0, volunteerCount: 0 }
  }

  const [
    { data: divisions },
    { count: totalTasks },
    { count: doneTasks },
    { count: volunteerCount },
  ] = await Promise.all([
    supabase
      .from('divisions')
      .select('id, name, type')
      .or(`parent_event_id.eq.${event.id},type.eq.shared`)
      .order('name', { ascending: true }),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('scope_type', 'event')
      .eq('scope_id', event.id),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('scope_type', 'event')
      .eq('scope_id', event.id)
      .eq('status', 'done' satisfies TaskStatus),
    supabase
      .from('user_event_scopes')
      .select('*', { count: 'exact', head: true })
      .eq('scope_type', 'event')
      .eq('scope_id', event.id),
  ])

  return {
    event: event as RunPageData['event'],
    divisions: (divisions ?? []) as Division[],
    totalTasks: totalTasks ?? 0,
    doneTasks: doneTasks ?? 0,
    volunteerCount: volunteerCount ?? 0,
  }
}

function eventStatusBadgeVariant(status: EventStatus): 'gold' | 'blue' | 'green' {
  if (status === 'upcoming') return 'gold'
  if (status === 'active') return 'blue'
  return 'green'
}

function divisionTypeBadgeVariant(type: DivisionType): 'blue' | 'gold' | 'slate' {
  if (type === 'shared') return 'blue'
  if (type === 'run') return 'gold'
  return 'slate'
}

function divisionTypeLabel(type: DivisionType): string {
  if (type === 'shared') return 'Shared'
  if (type === 'run') return 'Run'
  if (type === 'marketing') return 'Marketing'
  return 'Central Support'
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <Card>
      <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className={`font-display text-3xl font-black ${color ?? 'text-[#1d3fa0]'}`}>{value}</p>
    </Card>
  )
}

export default async function RunPage() {
  const { event, divisions, totalTasks, doneTasks, volunteerCount } = await getRunData()

  const taskPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1d3fa0]">
              5K Run
            </h1>
            {event && (
              <p className="text-xs font-mono text-slate-400 mt-0.5 uppercase tracking-widest">
                Event
              </p>
            )}
          </div>
          {event && (
            <Badge variant={eventStatusBadgeVariant(event.status)}>
              {event.status === 'upcoming' ? 'Upcoming' : event.status === 'active' ? 'Active' : 'Completed'}
            </Badge>
          )}
        </div>

        {!event ? (
          <EmptyState
            icon="🏃"
            title="Event not found"
            description="The 5K Run event has not been set up yet."
          />
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Tasks" value={totalTasks} />
              <StatCard
                label="Tasks Done"
                value={doneTasks}
                color={doneTasks === totalTasks && totalTasks > 0 ? 'text-green-700' : 'text-[#1d3fa0]'}
              />
              <StatCard label="Completion" value={`${taskPct}%`} />
              <StatCard label="Volunteers" value={volunteerCount} />
            </div>

            {/* Task progress bar */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400">
                  Task Progress
                </p>
                <span className="text-xs font-mono text-slate-500">
                  {doneTasks} / {totalTasks}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1d3fa0] rounded-full transition-all"
                  style={{ width: `${taskPct}%` }}
                />
              </div>
            </Card>

            {/* Divisions grid */}
            <div>
              <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-3">
                Divisions
              </p>
              {divisions.length === 0 ? (
                <EmptyState
                  icon="📂"
                  title="No divisions assigned"
                  description="Divisions assigned to this event will appear here."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {divisions.map((div) => (
                    <Card key={div.id}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-display font-black text-sm uppercase tracking-tight text-slate-800 leading-snug">
                          {div.name}
                        </p>
                        <Badge variant={divisionTypeBadgeVariant(div.type)}>
                          {divisionTypeLabel(div.type)}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
  )
}
