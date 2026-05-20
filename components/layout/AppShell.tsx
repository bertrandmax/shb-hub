import type { ReactNode } from 'react'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import type { AppUser } from '@/lib/auth/roles'

export function AppShell({
  user,
  children,
}: {
  user: AppUser
  children: ReactNode
}) {
  return (
    <div className="flex flex-col h-screen">
      <TopBar user={user} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar user={user} />
        <main className="flex-1 overflow-y-auto bg-page p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
