'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function addDocument(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthenticated')

  const name       = formData.get('name') as string
  const file_url   = formData.get('file_url') as string
  const scope_type = formData.get('scope_type') as string
  const scope_id   = formData.get('scope_id') as string

  const supabase = await createClient()

  await supabase.from('documents').insert({
    name,
    file_url,
    scope_type:   scope_type || null,
    scope_id:     scope_id   || null,
    uploaded_by:  user.id,
  })

  revalidatePath('/documents')
}
