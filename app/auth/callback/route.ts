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
          // Atomically consume token and retrieve role/scope data
          const { data: invite, error: updateError } = await supabase
            .from('invite_tokens')
            .update({ used_at: new Date().toISOString() })
            .eq('token', token)
            .eq('email', authedUser.email)
            .is('used_at', null)
            .gt('expires_at', new Date().toISOString())
            .select('role_type, scope_type, scope_id')
            .single()

          if (updateError) {
            console.error('Failed to consume invite token:', updateError.message)
          } else if (invite) {
            const name =
              authedUser.user_metadata?.full_name ??
              authedUser.user_metadata?.name ??
              authedUser.email

            // Upsert user profile with assigned role (overwrites on re-invite)
            const { error: upsertError } = await supabase
              .from('users')
              .upsert(
                { id: authedUser.id, email: authedUser.email, name, role_type: invite.role_type },
                { onConflict: 'id' },
              )
            if (upsertError) {
              console.error('Failed to upsert user profile:', upsertError.message)
            }

            // Insert scope (ignore duplicate — user may already have it)
            if (invite.scope_type && invite.scope_id) {
              const { error: scopeError } = await supabase
                .from('user_event_scopes')
                .upsert(
                  { user_id: authedUser.id, scope_type: invite.scope_type, scope_id: invite.scope_id },
                  { onConflict: 'user_id,scope_type,scope_id' },
                )
              if (scopeError) {
                console.error('Failed to insert user scope:', scopeError.message)
              }
            }
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
