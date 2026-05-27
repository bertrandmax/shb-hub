import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Route } from 'next'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { getCurrentUser } from '@/lib/auth/get-user'
import { canManageEvent } from '@/lib/auth/roles'
import { EVENTS } from '@/lib/constants'
import { updateShbCupStatus, addCompetition, addShbCupMilestone, addShbCupTask } from './actions'

type EventStatus = 'upcoming' | 'active' | 'completed'

interface Competition {
  id: string
  name: string
  status: EventStatus
  teamCount: number
  matchCount: number
}

interface ShbCupData {
  event: { id: string; name: string; status: EventStatus } | null
  competitions: Competition[]
}

async function getShbCupData(): Promise<ShbCupData> {
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, name, status')
    .eq('name', 'shb_cup')
    .single()

  if (!event) return { event: null, competitions: [] }

  const { data: competitions } = await supabase
    .from('competitions')
    .select('id, name, status')
    .eq('event_id', event.id)
    .order('order_index', { ascending: true })

  if (!competitions || competitions.length === 0) {
    return { event: event as ShbCupData['event'], competitions: [] }
  }

  const competitionIds = competitions.map((c) => c.id)

  const [{ data: teamCounts }, { data: matchCounts }] = await Promise.all([
    supabase
      .from('team_registrations')
      .select('competition_id')
      .in('competition_id', competitionIds),
    supabase
      .from('competition_matches')
      .select('competition_id')
      .in('competition_id', competitionIds),
  ])

  const teamsByComp = (teamCounts ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.competition_id] = (acc[r.competition_id] ?? 0) + 1
    return acc
  }, {})

  const matchesByComp = (matchCounts ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.competition_id] = (acc[r.competition_id] ?? 0) + 1
    return acc
  }, {})

  return {
    event: event as ShbCupData['event'],
    competitions: competitions.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status as EventStatus,
      teamCount: teamsByComp[c.id] ?? 0,
      matchCount: matchesByComp[c.id] ?? 0,
    })),
  }
}

function statusBadgeVariant(status: EventStatus): 'gold' | 'blue' | 'green' {
  if (status === 'upcoming') return 'gold'
  if (status === 'active') return 'blue'
  return 'green'
}

function statusLabel(status: EventStatus): string {
  if (status === 'upcoming') return 'Upcoming'
  if (status === 'active') return 'Active'
  return 'Completed'
}

export default async function ShbCupPage() {
  const [{ event, competitions }, user] = await Promise.all([
    getShbCupData(),
    getCurrentUser(),
  ])
  const canManage = !!user && canManageEvent(user.role_type, EVENTS.SHB_CUP)

  return (
    <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1d3fa0]">
              SHB Cup
            </h1>
            {event && (
              <p className="text-xs font-mono text-slate-400 mt-0.5 uppercase tracking-widest">
                Event
              </p>
            )}
          </div>
          {event && (
            <Badge variant={statusBadgeVariant(event.status)}>
              {statusLabel(event.status)}
            </Badge>
          )}
        </div>

        {!event ? (
          <EmptyState
            icon="🏆"
            title="Event not found"
            description="The SHB Cup event has not been set up yet."
          />
        ) : competitions.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No competitions yet"
            description="Competitions will appear here once added."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competitions.map((comp) => (
              <Link
                key={comp.id}
                href={`/shb-cup/${comp.id}` as Route}
                className="block group"
              >
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="font-display font-black text-sm uppercase tracking-tight text-slate-800 leading-snug">
                      {comp.name}
                    </h2>
                    <Badge variant={statusBadgeVariant(comp.status)}>
                      {statusLabel(comp.status)}
                    </Badge>
                  </div>
                  <p className="text-xs font-mono text-slate-500">
                    {comp.teamCount} {comp.teamCount === 1 ? 'team' : 'teams'} &middot;{' '}
                    {comp.matchCount} {comp.matchCount === 1 ? 'match' : 'matches'}
                  </p>
                  <p className="text-xs font-mono text-[#1d3fa0] mt-3 group-hover:underline">
                    View details →
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {canManage && event && (
          <div className="space-y-4">
            {/* Status toggle */}
            <div className="rounded-2xl border border-[#dde3ef] bg-white p-5 shadow-sm">
              <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-3">Manage Event</p>
              <div className="flex flex-wrap gap-3">
                {(['upcoming', 'active', 'completed'] as const).map((s) => (
                  <form key={s} action={updateShbCupStatus}>
                    <input type="hidden" name="status" value={s} />
                    <button type="submit" className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border border-[#dde3ef] hover:bg-[#f0f2f8] text-slate-600 capitalize">
                      → {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  </form>
                ))}
              </div>
            </div>

            {/* Add Competition */}
            <div className="rounded-2xl border border-[#dde3ef] bg-white p-5 shadow-sm">
              <details>
                <summary className="cursor-pointer text-xs font-mono font-semibold uppercase tracking-widest text-[#1d3fa0] select-none">+ Add Competition</summary>
                <form action={addCompetition} className="mt-3 flex gap-3 items-end flex-wrap">
                  <input type="hidden" name="event_id" value={event.id} />
                  <div className="flex flex-col gap-1 flex-1 min-w-40">
                    <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Name</label>
                    <input name="name" type="text" required placeholder="e.g. Football" className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]" />
                  </div>
                  <button type="submit" className="inline-flex items-center font-semibold rounded-xl px-4 py-2 text-sm bg-[#1d3fa0] text-white hover:bg-[#1a3690]">Add</button>
                </form>
              </details>
            </div>

            {/* Add Milestone */}
            <div className="rounded-2xl border border-[#dde3ef] bg-white p-5 shadow-sm">
              <details>
                <summary className="cursor-pointer text-xs font-mono font-semibold uppercase tracking-widest text-[#1d3fa0] select-none">+ Add Milestone</summary>
                <form action={addShbCupMilestone} className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <form action={addShbCupTask} className="mt-3 flex gap-3 items-end flex-wrap">
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
      </div>
  )
}
