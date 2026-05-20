vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: vi.fn(),
  })),
}))

import { getCurrentUser } from '@/lib/auth/get-user'

test('getCurrentUser returns null when no session', async () => {
  const user = await getCurrentUser()
  expect(user).toBeNull()
})
