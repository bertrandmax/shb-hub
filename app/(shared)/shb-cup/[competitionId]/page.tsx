import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

type EventStatus = 'upcoming' | 'active' | 'completed'
type MatchStatus = 'scheduled' | 'completed' | 'cancelled'
type PaymentStatus = 'unpaid' | 'paid'

interface MatchResult {
  id: string
  winner_team: string | null
  score_a: number | null
  score_b: number | null
}

interface CompetitionMatch {
  id: string
  team_a: string
  team_b: string
  venue: string | null
  scheduled_at: string | null
  status: MatchStatus
  match_results: MatchResult[]
}

interface TeamRegistration {
  id: string
  school_name: string
  team_name: string
  payment_status: PaymentStatus
  confirmed: boolean
}

interface CompetitionDetail {
  id: string
  name: string
  status: EventStatus
}

interface PageData {
  competition: CompetitionDetail
  matches: CompetitionMatch[]
  teams: TeamRegistration[]
}

async function getCompetitionData(competitionId: string): Promise<PageData | null> {
  const supabase = await createClient()

  const { data: competition } = await supabase
    .from('competitions')
    .select('id, name, status')
    .eq('id', competitionId)
    .single()

  if (!competition) return null

  const [{ data: matches }, { data: teams }] = await Promise.all([
    supabase
      .from('competition_matches')
      .select('id, team_a, team_b, venue, scheduled_at, status, match_results(id, winner_team, score_a, score_b)')
      .eq('competition_id', competitionId)
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('team_registrations')
      .select('id, school_name, team_name, payment_status, confirmed')
      .eq('competition_id', competitionId)
      .order('school_name', { ascending: true }),
  ])

  return {
    competition: competition as CompetitionDetail,
    matches: (matches ?? []) as CompetitionMatch[],
    teams: (teams ?? []) as TeamRegistration[],
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

function matchStatusVariant(status: MatchStatus): 'gold' | 'blue' | 'green' | 'slate' {
  if (status === 'scheduled') return 'gold'
  if (status === 'completed') return 'green'
  return 'slate'
}

function formatMatchDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function CompetitionDetailPage({
  params,
  searchParams,
}: {
  params: { competitionId: string }
  searchParams: { tab?: string }
}) {
  const data = await getCompetitionData(params.competitionId)
  if (!data) notFound()

  const { competition, matches, teams } = data
  const activeTab = searchParams.tab === 'teams' ? 'teams' : 'matches'

  return (
    <div className="max-w-5xl space-y-6">
        {/* Back link + header */}
        <div>
          <Link
            href={'/shb-cup' as Route}
            className="inline-flex items-center gap-1 text-xs font-mono text-[#1d3fa0] hover:underline mb-3"
          >
            ← Back to SHB Cup
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1d3fa0]">
              {competition.name}
            </h1>
            <Badge variant={statusBadgeVariant(competition.status)}>
              {statusLabel(competition.status)}
            </Badge>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 border-b border-[#dde3ef]">
          <Link
            href={`/shb-cup/${competition.id}?tab=matches` as Route}
            className={[
              'px-4 py-2 text-xs font-mono font-semibold uppercase tracking-widest border-b-2 -mb-px transition-colors',
              activeTab === 'matches'
                ? 'border-[#1d3fa0] text-[#1d3fa0]'
                : 'border-transparent text-slate-400 hover:text-slate-600',
            ].join(' ')}
          >
            Matches ({matches.length})
          </Link>
          <Link
            href={`/shb-cup/${competition.id}?tab=teams` as Route}
            className={[
              'px-4 py-2 text-xs font-mono font-semibold uppercase tracking-widest border-b-2 -mb-px transition-colors',
              activeTab === 'teams'
                ? 'border-[#1d3fa0] text-[#1d3fa0]'
                : 'border-transparent text-slate-400 hover:text-slate-600',
            ].join(' ')}
          >
            Teams ({teams.length})
          </Link>
        </div>

        {/* Matches tab */}
        {activeTab === 'matches' && (
          <>
            {matches.length === 0 ? (
              <EmptyState
                icon="🏅"
                title="No matches scheduled"
                description="Matches will appear here once added."
              />
            ) : (
              <div className="space-y-3">
                {matches.map((match) => {
                  const result = match.match_results?.[0] ?? null
                  return (
                    <Card key={match.id}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-1 min-w-0">
                          <p className="font-display font-black text-sm uppercase tracking-tight text-slate-800">
                            {match.team_a}{' '}
                            <span className="text-slate-400 font-body font-semibold">vs</span>{' '}
                            {match.team_b}
                          </p>
                          {result && match.status === 'completed' && (
                            <p className="text-xs font-mono text-[#1d3fa0] font-semibold">
                              Score: {result.score_a ?? '—'} – {result.score_b ?? '—'}
                              {result.winner_team && (
                                <span className="ml-2 text-green-700">
                                  Winner: {result.winner_team}
                                </span>
                              )}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs font-mono text-slate-500 flex-wrap">
                            {match.venue && <span>📍 {match.venue}</span>}
                            <span>🕐 {formatMatchDate(match.scheduled_at)}</span>
                          </div>
                        </div>
                        <Badge variant={matchStatusVariant(match.status)}>
                          {match.status}
                        </Badge>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Teams tab */}
        {activeTab === 'teams' && (
          <>
            {teams.length === 0 ? (
              <EmptyState
                icon="🏫"
                title="No teams registered"
                description="Team registrations will appear here."
              />
            ) : (
              <Card className="p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#dde3ef] bg-[#f0f2f8]">
                      <th className="text-left px-5 py-3 text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">
                        School
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">
                        Team Name
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">
                        Payment
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">
                        Confirmed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dde3ef]">
                    {teams.map((team) => (
                      <tr key={team.id} className="hover:bg-[#f0f2f8] transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-800 font-body">
                          {team.school_name}
                        </td>
                        <td className="px-5 py-3 text-slate-600 font-body">
                          {team.team_name}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={team.payment_status === 'paid' ? 'green' : 'gold'}>
                            {team.payment_status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={team.confirmed ? 'green' : 'slate'}>
                            {team.confirmed ? 'Confirmed' : 'Pending'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </>
        )}
      </div>
  )
}
