import type { AppUser } from '@/lib/auth/roles'
import { NotificationBell } from './NotificationBell'

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

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

export function TopBar({ user, onToggle, userId }: { user: AppUser; onToggle?: () => void; userId: string }) {
  const roleLabel = ROLE_LABELS[user.role_type] ?? user.role_type

  return (
    <header className="h-14 bg-[#1d3fa0] shadow-topbar flex items-center px-5 gap-4 shrink-0 z-10 relative">
      <button
        onClick={onToggle}
        className="md:hidden flex items-center justify-center w-8 h-8 text-white/80 hover:text-white transition-colors"
        aria-label="Toggle menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <span className="font-display font-black text-white text-lg tracking-widest uppercase select-none">
        SHB Hub
      </span>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden sm:block px-2 py-0.5 rounded-md bg-[#a07020]/30 text-[#fdf3d8] text-[10px] font-mono font-semibold tracking-widest uppercase border border-[#a07020]/40">
          {roleLabel}
        </span>

        <NotificationBell userId={userId} />

        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm font-body hidden sm:block">{user.name}</span>
          <div className="w-8 h-8 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-display font-bold tracking-wide">
              {initials(user.name)}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
