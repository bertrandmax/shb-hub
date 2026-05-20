// MUST be before imports
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          is: vi.fn(() => ({
            gt: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null }),
            })),
          })),
        })),
      })),
    })),
  })),
}))

import { validateInviteToken } from '@/lib/auth/invite'

test('returns null for expired token', async () => {
  const result = await validateInviteToken('fake-token')
  expect(result).toBeNull()
})
