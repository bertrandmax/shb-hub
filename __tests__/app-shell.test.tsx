vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  }),
}))

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

import { render, screen } from '@testing-library/react'
import { AppShell } from '@/components/layout/AppShell'

const mockUser = {
  id: '1', email: 'pm@test.com', name: 'PM User',
  role_type: 'project_manager' as const, scopes: [],
}

test('AppShell renders brand name', () => {
  render(<AppShell user={mockUser}><div>content</div></AppShell>)
  expect(screen.getByText('SHB Hub')).toBeInTheDocument()
})

test('AppShell renders children', () => {
  render(<AppShell user={mockUser}><div>page content</div></AppShell>)
  expect(screen.getByText('page content')).toBeInTheDocument()
})
