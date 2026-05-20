'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function inviteUser(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthenticated')

  const email     = formData.get('email') as string
  const role_type = formData.get('role_type') as string
  const scope_type = formData.get('scope_type') as string | null
  const scope_id  = formData.get('scope_id') as string | null

  const supabase = await createClient()

  const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  await supabase.from('invite_tokens').insert({
    email,
    role_type,
    scope_type: scope_type || null,
    scope_id:   scope_id   || null,
    expires_at,
    invited_by: user.id,
  })

  revalidatePath('/admin/users')
}
