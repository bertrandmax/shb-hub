'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function createContentPost(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthenticated')

  const platform     = formData.get('platform') as string
  const title        = formData.get('title') as string
  const caption      = (formData.get('caption') as string) || null
  const scheduled_at = (formData.get('scheduled_at') as string) || null
  const status       = (formData.get('status') as string) || 'draft'

  await supabase.from('content_calendar_posts').insert({
    platform,
    title,
    caption,
    scheduled_at: scheduled_at || null,
    status,
    created_by: user.id,
  })

  revalidatePath('/content-calendar')
}
