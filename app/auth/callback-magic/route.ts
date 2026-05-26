import { getRequestOrigin } from '@/lib/get-origin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = getRequestOrigin(request)
  const token_hash = searchParams.get('token_hash')

  if (!token_hash) {
    return NextResponse.redirect(`${origin}/login?error=missing_token`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=verify_failed`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
