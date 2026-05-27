'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function addMeetingNote(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthenticated')

  const title          = formData.get('title') as string
  const body           = (formData.get('body') as string) || null
  const scope_type     = (formData.get('scope_type') as string) || null
  const scope_id       = (formData.get('scope_id') as string) || null
  const attachment_url = (formData.get('attachment_url') as string) || null

  const supabase = await createClient()

  await supabase.from('meeting_notes').insert({
    title,
    body,
    scope_type,
    scope_id,
    attachment_url,
    created_by: user.id,
  })

  revalidatePath('/admin/meeting-notes')
}
