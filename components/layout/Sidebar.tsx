'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'
import { cn } from '@/lib/utils'
import type { AppUser } from '@/lib/auth/roles'
import { isProjectManager, isMarketingHead } from '@/lib/auth/roles'

interface NavItem { label: string; href: string; icon: React.ReactNode }
interface NavSection { section: string; items: NavItem[] }

function Icon({ d, d2 }: { d: string; d2?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] shrink-0">
      <path d={d} />
      {d2 && <path d={d2} />}
    </svg>
  )
}

const ICONS = {
  dashboard:       <Icon d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />,
  trophy:          <Icon d="M6 9H3V5h3M18 9h3V5h-3M12 17v4M8 21h8M7 4h10l-1 5a5 5 0 01-8 0L7 4z" />,
  zap:             <Icon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  users:           <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" d2="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
  dollar:          <Icon d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />,
  alert:           <Icon d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />,
  package:         <Icon d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" d2="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />,
  fileText:        <Icon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" />,
  calendar:        <Icon d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" />,
  ticket:          <Icon d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />,
  userCheck:       <Icon d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" d2="M17 11l2 2 4-4" />,
  clipboard:       <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4" />,
  barChart:        <Icon d="M18 20V10M12 20V4M6 20v-6" />,
}

function buildNav(user: AppUser): NavSection[] {
  const isPM   = isProjectManager(user.role_type)
  const isMktg = isMarketingHead(user.role_type)

  const nav: NavSection[] = [
    {
      section: '',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: ICONS.dashboard },
      ],
    },
    {
      section: 'Events',
      items: [
        { label: 'SHB Cup', href: '/shb-cup', icon: ICONS.trophy },
        { label: '5K Run',  href: '/5k-run',  icon: ICONS.zap },
      ],
    },
    {
      section: 'Manage',
      items: [
        { label: 'Sponsors',  href: '/sponsors',  icon: ICONS.users },
        { label: 'Funds',     href: '/funds',     icon: ICONS.dollar },
        { label: 'Blockers',  href: '/blockers',  icon: ICONS.alert },
        { label: 'Resources', href: '/resources', icon: ICONS.package },
        { label: 'Documents', href: '/documents', icon: ICONS.fileText },
      ],
    },
  ]

  if (isPM || isMktg) {
    nav.push({
      section: 'Marketing',
      items: [
        { label: 'Content Calendar', href: '/content-calendar', icon: ICONS.calendar },
        { label: 'Merch & Tickets',  href: '/merch',            icon: ICONS.ticket },
      ],
    })
  }

  if (isPM) {
    nav.push({
      section: 'Admin',
      items: [
        { label: 'Users',         href: '/admin/users',          icon: ICONS.users },
        { label: 'Volunteers',    href: '/admin/volunteers',     icon: ICONS.userCheck },
        { label: 'Meeting Notes', href: '/admin/meeting-notes',  icon: ICONS.clipboard },
        { label: 'Reports',       href: '/admin/reports',        icon: ICONS.barChart },
      ],
    })
  }

  return nav
}

function NavContent({ user, onClose }: { user: AppUser; onClose?: () => void }) {
  const pathname = usePathname()
  const nav = buildNav(user)

  return (
    <>
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {nav.map(({ section, items }, sectionIndex) => (
          <div key={section || `section-${sectionIndex}`} className={cn(section && 'mt-4')}>
            {section && (
              <p className="px-3 mb-1.5 text-[9.5px] font-mono font-semibold uppercase tracking-[0.14em] text-white/30 select-none">
                {section}
              </p>
            )}
            {items.map(({ label, href, icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={href as Route}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-body font-medium',
                    'transition-all duration-150 ease-out',
                    active
                      ? 'bg-blue text-white shadow-sm'
                      : 'text-white/55 hover:text-white hover:bg-white/[0.07]',
                  )}
                >
                  <span className={cn(
                    'transition-colors duration-150',
                    active ? 'text-white' : 'text-white/40 group-hover:text-white/70',
                  )}>
                    {icon}
                  </span>
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/[0.08]">
        <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 text-center select-none">
          SHB Hub · v1
        </p>
      </div>
    </>
  )
}

export function Sidebar({
  user,
  isOpen,
  onClose,
}: {
  user: AppUser
  isOpen?: boolean
  onClose?: () => void
}) {
  return (
    <>
      {/* Backdrop — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-sidebar flex flex-col overflow-y-auto',
          // Mobile: fixed drawer
          'fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible, relative
          'md:relative md:w-52 md:translate-x-0 md:shrink-0',
        )}
      >
        {/* Mobile close button */}
        <div className="flex justify-end px-3 pt-3 md:hidden">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 text-white/60 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <NavContent user={user} onClose={onClose} />
      </aside>
    </>
  )
}
