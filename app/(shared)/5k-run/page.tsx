import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { getCurrentUser } from '@/lib/auth/get-user'
import { canManageEvent } from '@/lib/auth/roles'
import { EVENTS } from '@/lib/constants'
import { updateRunStatus, addDivision, addRunMilestone, addRunTask } from './actions'

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
  const [{ event, divisions, totalTasks, doneTasks, volunteerCount }, user] = await Promise.all([
    getRunData(),
    getCurrentUser(),
  ])
  const canManage = !!user && canManageEvent(user.role_type, EVENTS.RUN)

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

            {canManage && (
              <div className="space-y-4">
                {/* Status toggle */}
                <div className="rounded-2xl border border-[#dde3ef] bg-white p-5 shadow-sm">
                  <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-3">Manage Event</p>
                  <div className="flex flex-wrap gap-3">
                    {(['upcoming', 'active', 'completed'] as const).map((s) => (
                      <form key={s} action={updateRunStatus}>
                        <input type="hidden" name="status" value={s} />
                        <button type="submit" className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border border-[#dde3ef] hover:bg-[#f0f2f8] text-slate-600 capitalize">
                          → {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>

                {/* Add Division */}
                <div className="rounded-2xl border border-[#dde3ef] bg-white p-5 shadow-sm">
                  <details>
                    <summary className="cursor-pointer text-xs font-mono font-semibold uppercase tracking-widest text-[#1d3fa0] select-none">+ Add Division</summary>
                    <form action={addDivision} className="mt-3 flex gap-3 items-end flex-wrap">
                      <input type="hidden" name="event_id" value={event.id} />
                      <div className="flex flex-col gap-1 flex-1 min-w-40">
                        <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Name</label>
                        <input name="name" type="text" required className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Type</label>
                        <select name="type" className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]">
                          <option value="run">Run</option>
                          <option value="shared">Shared</option>
                          <option value="marketing">Marketing</option>
                          <option value="central_support">Central Support</option>
                        </select>
                      </div>
                      <button type="submit" className="inline-flex items-center font-semibold rounded-xl px-4 py-2 text-sm bg-[#1d3fa0] text-white hover:bg-[#1a3690] self-end">Add</button>
                    </form>
                  </details>
                </div>

                {/* Add Milestone */}
                <div className="rounded-2xl border border-[#dde3ef] bg-white p-5 shadow-sm">
                  <details>
                    <summary className="cursor-pointer text-xs font-mono font-semibold uppercase tracking-widest text-[#1d3fa0] select-none">+ Add Milestone</summary>
                    <form action={addRunMilestone} className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="hidden" name="event_id" value={event.id} />
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Title</label>
                        <input name="title" type="text" required className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Date</label>
                        <input name="date" type="date" required className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]" />
                      </div>
                      <div className="sm:col-span-2 flex flex-col gap-1">
                        <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Description</label>
                        <input name="description" type="text" className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]" />
                      </div>
                      <div className="sm:col-span-2 flex justify-end">
                        <button type="submit" className="inline-flex items-center font-semibold rounded-xl px-4 py-2 text-sm bg-[#1d3fa0] text-white hover:bg-[#1a3690]">Save Milestone</button>
                      </div>
                    </form>
                  </details>
                </div>

                {/* Add Task */}
                <div className="rounded-2xl border border-[#dde3ef] bg-white p-5 shadow-sm">
                  <details>
                    <summary className="cursor-pointer text-xs font-mono font-semibold uppercase tracking-widest text-[#1d3fa0] select-none">+ Add Task</summary>
                    <form action={addRunTask} className="mt-3 flex gap-3 items-end flex-wrap">
                      <input type="hidden" name="event_id" value={event.id} />
                      <div className="flex flex-col gap-1 flex-1 min-w-40">
                        <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Task Title</label>
                        <input name="title" type="text" required className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Due Date</label>
                        <input name="due_date" type="date" className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]" />
                      </div>
                      <button type="submit" className="inline-flex items-center font-semibold rounded-xl px-4 py-2 text-sm bg-[#1d3fa0] text-white hover:bg-[#1a3690] self-end">Add</button>
                    </form>
                  </details>
                </div>
              </div>
            )}
          </>
        )}
      </div>
  )
}
