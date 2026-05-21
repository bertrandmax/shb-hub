'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function createResourceRequest(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthenticated')

  const title       = formData.get('title') as string
  const description = formData.get('description') as string
  const scope_type  = formData.get('scope_type') as string
  const scope_id    = formData.get('scope_id') as string

  const supabase = await createClient()

  await supabase.from('resource_requests').insert({
    title,
    description,
    scope_type: scope_type || null,
    scope_id:   scope_id   || null,
    requested_by: user.id,
    status: 'pending',
  })

  revalidatePath('/resources')
}

export async function updateRequestStatus(id: string, status: string) {
  const supabase = await createClient()

  await supabase
    .from('resource_requests')
    .update({ status })
    .eq('id', id)

  revalidatePath('/resources')
}

export async function approveResourceRequest(id: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthenticated')
  await supabase.from('resource_requests').update({ status: 'approved' }).eq('id', id)
  revalidatePath('/resources')
}

export async function rejectResourceRequest(id: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthenticated')
  await supabase.from('resource_requests').update({ status: 'rejected' }).eq('id', id)
  revalidatePath('/resources')
}
