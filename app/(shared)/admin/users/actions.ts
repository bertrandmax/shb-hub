'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { isProjectManager } from '@/lib/auth/roles'
import { revalidatePath } from 'next/cache'

export type InviteState = { success?: true; error?: string }

export async function inviteUser(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const user = await getCurrentUser()
  if (!user || !isProjectManager(user.role_type)) return { error: 'Unauthorized' }

  const email      = (formData.get('email') as string).trim().toLowerCase()
  const role_type  = formData.get('role_type') as string
  const scope_type = (formData.get('scope_type') as string) || null
  const scope_id   = (formData.get('scope_id')   as string) || null

  if (!email || !role_type) return { error: 'Email and role are required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Invalid email address.' }

  const supabase = await createClient()

  // Check for existing unused invite
  const { data: existing } = await supabase
    .from('invite_tokens')
    .select('id')
    .eq('email', email)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (existing) return { error: `A pending invite already exists for ${email}.` }

  const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase.from('invite_tokens').insert({
    email,
    role_type,
    scope_type,
    scope_id: scope_id || null,
    expires_at,
    invited_by: user.id,
  })

  if (error) return { error: `Failed to create invite: ${error.message}` }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function cancelInvite(id: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user || !isProjectManager(user.role_type)) throw new Error('Unauthorized')

  const supabase = await createClient()
  await supabase.from('invite_tokens').delete().eq('id', id).is('used_at', null)
  revalidatePath('/admin/users')
}
