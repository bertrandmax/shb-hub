import { createClient } from '@/lib/supabase/server'
import { type RoleType } from '@/lib/auth/roles'

export interface InviteTokenData {
  id:         string
  email:      string
  role_type:  RoleType
  scope_type: string
  scope_id:   string
}

export async function validateInviteToken(token: string): Promise<InviteTokenData | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('invite_tokens')
    .select('id, email, role_type, scope_type, scope_id')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()
  return data ?? null
}
