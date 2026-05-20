import { Badge } from '@/components/ui/Badge'
import type { AppUser } from '@/lib/auth/roles'

const ROLE_LABELS: Record<string, string> = {
  project_manager:              'PM',
  shb_cup_pm:                   'SHB PM',
  shb_cup_vice_pm:              'SHB Vice',
  '5k_run_pm':                  '5K PM',
  '5k_run_vice_pm':             '5K Vice',
  competition_coordinator:      'Coord',
  competition_vice_coordinator: 'Vice Coord',
  competition_pic_head:         'PIC',
  competition_pic_vice:         'PIC Vice',
  division_head:                'Head',
  division_vice_head:           'Vice',
  marketing_head:               'Mktg Head',
}

export function TopBar({ user }: { user: AppUser }) {
  return (
    <header className="h-14 bg-[#1d3fa0] flex items-center px-5 gap-4 shrink-0">
      <span className="font-display font-black text-white text-lg tracking-widest uppercase">
        SHB Hub
      </span>
      <div className="ml-auto flex items-center gap-3">
        <Badge variant="gold">{ROLE_LABELS[user.role_type] ?? user.role_type}</Badge>
        <span className="text-white/70 text-sm font-body">{user.name}</span>
      </div>
    </header>
  )
}
