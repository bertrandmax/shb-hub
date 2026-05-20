import { createClient } from '@/lib/supabase/server'
import type { AppUser } from '@/lib/auth/roles'

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, name, role_type')
    .eq('id', user.id)
    .single()
  if (!profile) return null

  const { data: scopes } = await supabase
    .from('user_event_scopes')
    .select('scope_type, scope_id')
    .eq('user_id', user.id)

  return {
    id:        profile.id,
    email:     profile.email,
    name:      profile.name,
    role_type: profile.role_type,
    scopes:    scopes ?? [],
  }
}
