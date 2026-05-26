import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import type { ReactNode } from 'react'

export default async function SharedLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return <AppShell user={user}>{children}</AppShell>
}
