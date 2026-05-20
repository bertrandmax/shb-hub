// Set dummy env vars before import so createBrowserClient doesn't throw
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

import { createClient } from '@/lib/supabase/client'

test('createClient returns supabase instance', () => {
  const client = createClient()
  expect(client).toBeDefined()
  expect(typeof client.from).toBe('function')
})
