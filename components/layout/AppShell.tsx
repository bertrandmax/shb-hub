'use client'
import { useState, useEffect, type ReactNode } from 'react'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => document.body.classList.remove('overflow-hidden')
  }, [sidebarOpen])

  return (
    <div className="flex flex-col h-screen bg-sidebar">
      <TopBar user={user} onToggle={() => setSidebarOpen(o => !o)} userId={user.id} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-page p-4 md:p-6 rounded-tl-xl animate-fade-up">
          {children}
        </main>
      </div>
    </div>
  )
}
