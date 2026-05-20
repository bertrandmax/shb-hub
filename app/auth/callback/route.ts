import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'
  const token = searchParams.get('invite')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (token) {
        const { data: { user: authedUser } } = await supabase.auth.getUser()
        if (authedUser?.email) {
          const { error: updateError } = await supabase
            .from('invite_tokens')
            .update({ used_at: new Date().toISOString() })
            .eq('token', token)
            .eq('email', authedUser.email)
            .is('used_at', null)
            .gt('expires_at', new Date().toISOString())
          if (updateError) {
            console.error('Failed to mark invite token as used:', updateError.message)
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
