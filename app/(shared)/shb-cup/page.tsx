import { getCurrentUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

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
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { event, competitions } = await getShbCupData()

  return (
    <AppShell user={user}>
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
      </div>
    </AppShell>
  )
}
