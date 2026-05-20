import { createClient } from '@/lib/supabase/server'
import { ROLE_TYPE, type RoleType, type AppUser } from '@/lib/auth/roles'

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, name, role_type')
    .eq('id', user.id)
    .single()
  if (profileError) {
    if (profileError.code === 'PGRST116') return null
    throw profileError
  }
  if (!profile) return null

  const { data: scopes, error: scopesError } = await supabase
    .from('user_event_scopes')
    .select('scope_type, scope_id')
    .eq('user_id', user.id)
  if (scopesError) throw scopesError

  const role = (Object.values(ROLE_TYPE) as string[]).includes(profile.role_type)
    ? (profile.role_type as RoleType)
    : null
  if (!role) return null

  return {
    id:        profile.id,
    email:     profile.email,
    name:      profile.name,
    role_type: role,
    scopes:    scopes ?? [],
  }
}
