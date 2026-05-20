'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function flagBlocker(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthenticated')

  const title       = formData.get('title') as string
  const description = (formData.get('description') as string) || null
  const priority    = (formData.get('priority') as string) || 'medium'
  const scope_type  = (formData.get('scope_type') as string) || 'global'
  const scope_id    = (formData.get('scope_id') as string) || null

  await supabase.from('blockers').insert({
    title,
    description,
    priority,
    scope_type,
    scope_id,
    status: 'open',
    flagged_by: user.id,
  })

  revalidatePath('/blockers')
}

export async function updateBlockerStatus(id: string, status: string) {
  const supabase = await createClient()
  await supabase.from('blockers').update({ status }).eq('id', id)
  revalidatePath('/blockers')
}
