'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { AppUser } from '@/lib/auth/roles'
import { isProjectManager, isMarketingHead } from '@/lib/auth/roles'

interface NavItem { label: string; href: string }
interface NavSection { section: string; items: NavItem[] }

function buildNav(user: AppUser): NavSection[] {
  const isPM   = isProjectManager(user.role_type)
  const isMktg = isMarketingHead(user.role_type)

  const nav: NavSection[] = [
    { section: '', items: [{ label: 'Dashboard', href: '/dashboard' }] },
    {
      section: 'Events',
      items: [
        { label: 'SHB Cup', href: '/shb-cup' },
        { label: '5K Run',  href: '/5k-run' },
      ],
    },
    {
      section: 'Manage',
      items: [
        { label: 'Sponsors',   href: '/sponsors' },
        { label: 'Funds',      href: '/funds' },
        { label: 'Blockers',   href: '/blockers' },
        { label: 'Resources',  href: '/resources' },
        { label: 'Documents',  href: '/documents' },
      ],
    },
  ]

  if (isPM || isMktg) {
    nav.push({
      section: 'Marketing',
      items: [
        { label: 'Content Calendar', href: '/content-calendar' },
        { label: 'Merch & Tickets',  href: '/merch' },
      ],
    })
  }

  if (isPM) {
    nav.push({
      section: 'Admin',
      items: [
        { label: 'Users',         href: '/admin/users' },
        { label: 'Volunteers',    href: '/admin/volunteers' },
        { label: 'Meeting Notes', href: '/admin/meeting-notes' },
        { label: 'Reports',       href: '/admin/reports' },
      ],
    })
  }

  return nav
}

export function Sidebar({ user }: { user: AppUser }) {
  const pathname = usePathname()
  const nav = buildNav(user)

  return (
    <aside className="w-52 bg-white border-r border-[#dde3ef] flex flex-col shrink-0 overflow-y-auto">
      {nav.map(({ section, items }) => (
        <div key={section} className="mt-3">
          {section && (
            <p className="px-4 mb-1 text-[10px] font-mono font-medium uppercase tracking-[0.12em] text-[#a07020]">
              {section}
            </p>
          )}
          {items.map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'block mx-2 px-3 py-2 rounded-lg text-sm font-body transition-colors',
                  active
                    ? 'bg-[#dce7ff] text-[#1d3fa0] font-semibold border-l-2 border-[#1d3fa0] rounded-l-none'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                )}
              >
                {label}
              </Link>
            )
          })}
        </div>
      ))}
    </aside>
  )
}
