'use server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'

export async function markNotificationRead(id: string) {
  const user = await getCurrentUser()
  if (!user) return
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', user.id)
}

export async function markAllNotificationsRead() {
  const user = await getCurrentUser()
  if (!user) return
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)
}
