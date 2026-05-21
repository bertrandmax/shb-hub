'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function addVolunteer(formData: FormData) {
  const name             = formData.get('name') as string
  const role_description = formData.get('role_description') as string
  const scope_type       = formData.get('scope_type') as string
  const scope_id         = formData.get('scope_id') as string
  const confirmed        = formData.get('confirmed') === 'on'

  const supabase = await createClient()

  await supabase.from('volunteers').insert({
    name,
    role_description,
    assigned_to_scope_type: scope_type || null,
    assigned_to_scope_id:   scope_id   || null,
    confirmed,
  })

  revalidatePath('/admin/volunteers')
}

export async function toggleVolunteerConfirmed(id: string, confirmed: boolean) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthenticated')

  await supabase
    .from('volunteers')
    .update({ confirmed })
    .eq('id', id)

  revalidatePath('/admin/volunteers')
}
