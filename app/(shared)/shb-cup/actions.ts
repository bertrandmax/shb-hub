'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { canManageEvent } from '@/lib/auth/roles'
import { EVENTS } from '@/lib/constants'
import { revalidatePath } from 'next/cache'

const EVENT_NAME = EVENTS.SHB_CUP

async function requireShbCupManager() {
  const user = await getCurrentUser()
  if (!user || !canManageEvent(user.role_type, EVENT_NAME)) throw new Error('Unauthorized')
  return user
}

const VALID_STATUSES = ['upcoming', 'active', 'completed'] as const
type EventStatus = typeof VALID_STATUSES[number]

export async function updateShbCupStatus(formData: FormData) {
  await requireShbCupManager()
  const status = formData.get('status') as string
  if (!VALID_STATUSES.includes(status as EventStatus)) throw new Error('Invalid status')
  const supabase = await createClient()
  await supabase.from('events').update({ status }).eq('name', EVENT_NAME)
  revalidatePath('/shb-cup')
}

export async function addCompetition(formData: FormData) {
  await requireShbCupManager()
  const name    = formData.get('name') as string
  const eventId = formData.get('event_id') as string
  const supabase = await createClient()
  await supabase.from('competitions').insert({ event_id: eventId, name, status: 'upcoming', order_index: 0 })
  revalidatePath('/shb-cup')
}

export async function addShbCupMilestone(formData: FormData) {
  const user        = await requireShbCupManager()
  const event_id    = formData.get('event_id') as string
  const title       = formData.get('title') as string
  const description = (formData.get('description') as string) || null
  const date        = formData.get('date') as string
  const supabase    = await createClient()
  await supabase.from('event_milestones').insert({ event_id, title, description, date, created_by: user.id })
  revalidatePath('/shb-cup')
}

export async function addShbCupTask(formData: FormData) {
  await requireShbCupManager()
  const event_id = formData.get('event_id') as string
  const title    = formData.get('title') as string
  const due_date = (formData.get('due_date') as string) || null
  const supabase = await createClient()
  await supabase.from('tasks').insert({
    title,
    scope_type: 'event',
    scope_id: event_id,
    due_date,
    status: 'todo',
  })
  revalidatePath('/shb-cup')
}
