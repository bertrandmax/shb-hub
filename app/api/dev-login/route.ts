import { getRequestOrigin } from '@/lib/get-origin'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// DEV ONLY — authenticates the PM user without OAuth, for automated testing
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not available' }, { status: 404 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: 'bertrand.student@shb.sch.id',
  })

  if (error || !data.properties?.hashed_token) {
    return NextResponse.json({ error: error?.message ?? 'no token' }, { status: 500 })
  }

  const token_hash = data.properties.hashed_token
  const origin = getRequestOrigin(request)
  const url = `${origin}/auth/callback-magic?token_hash=${token_hash}`
  return NextResponse.redirect(url)
}
