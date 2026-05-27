import { getCurrentUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { isProjectManager, ROLE_TYPE } from '@/lib/auth/roles'
import { cancelInvite } from './actions'
import { InviteUserForm } from './InviteUserForm'

const ROLE_LABELS: Record<string, string> = {
  project_manager:              'Project Manager',
  shb_cup_pm:                   'SHB Cup PM',
  shb_cup_vice_pm:              'SHB Cup Vice PM',
  '5k_run_pm':                  '5K Run PM',
  '5k_run_vice_pm':             '5K Run Vice PM',
  competition_coordinator:      'Competition Coordinator',
  competition_vice_coordinator: 'Competition Vice Coordinator',
  competition_pic_head:         'Competition PIC Head',
  competition_pic_vice:         'Competition PIC Vice',
  division_head:                'Division Head',
  division_vice_head:           'Division Vice Head',
  marketing_head:               'Marketing Head',
}

const SCOPE_TYPE_OPTIONS = [
  { value: 'global',      label: 'Global' },
  { value: 'event',       label: 'Event' },
  { value: 'competition', label: 'Competition' },
  { value: 'division',    label: 'Division' },
]

export default async function UsersPage() {
  const user = (await getCurrentUser())!
  if (!isProjectManager(user.role_type)) redirect('/unauthorized')

  const supabase = await createClient()

  const [{ data: users }, { data: invites }] = await Promise.all([
    supabase
      .from('users')
      .select('id, name, email, role_type, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('invite_tokens')
      .select('id, email, role_type, scope_type, scope_id, expires_at, created_at')
      .is('used_at', null)
      .order('created_at', { ascending: false }),
  ])

  const userList   = (users   ?? []) as any[]
  const inviteList = (invites ?? []) as any[]

  function fmt(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function isExpired(expires_at: string) {
    return new Date(expires_at) < new Date()
  }

  return (
      <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1d3fa0]">
              Users
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{userList.length} member{userList.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-4">
            All Members
          </p>
          {userList.length === 0 ? (
            <p className="text-sm text-slate-400 font-mono py-4 text-center">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#dde3ef]">
                    <th className="text-left py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Name</th>
                    <th className="text-left py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Email</th>
                    <th className="text-left py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Role</th>
                    <th className="text-left py-2 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.map((u) => (
                    <tr key={u.id} className="border-b border-[#dde3ef] last:border-0">
                      <td className="py-3 pr-4 font-semibold text-slate-800">{u.name ?? '—'}</td>
                      <td className="py-3 pr-4 font-mono text-slate-600 text-xs">{u.email}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={u.role_type === 'project_manager' ? 'blue' : 'slate'}>
                          {ROLE_LABELS[u.role_type] ?? u.role_type}
                        </Badge>
                      </td>
                      <td className="py-3 text-xs font-mono text-slate-400">{fmt(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pending Invites */}
        <Card>
          <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-4">
            Pending Invites ({inviteList.length})
          </p>
          {inviteList.length === 0 ? (
            <p className="text-sm text-slate-400 font-mono py-4 text-center">No pending invites.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#dde3ef]">
                    <th className="text-left py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Email</th>
                    <th className="text-left py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Role</th>
                    <th className="text-left py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Expires</th>
                    <th className="text-left py-2 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Status</th>
                    <th className="text-left py-2 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {inviteList.map((inv) => (
                    <tr key={inv.id} className="border-b border-[#dde3ef] last:border-0">
                      <td className="py-3 pr-4 font-mono text-slate-700 text-xs">{inv.email}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="slate">{ROLE_LABELS[inv.role_type] ?? inv.role_type}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-xs font-mono text-slate-400">{fmt(inv.expires_at)}</td>
                      <td className="py-3">
                        <Badge variant={isExpired(inv.expires_at) ? 'red' : 'gold'}>
                          {isExpired(inv.expires_at) ? 'Expired' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <form action={cancelInvite.bind(null, inv.id)}>
                          <button
                            type="submit"
                            className="text-xs font-mono text-red-500 hover:text-red-700 hover:underline"
                          >
                            Cancel
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Invite User inline form */}
        <Card>
          <InviteUserForm />
        </Card>
      </div>
  )
}
