'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { canManageEvent } from '@/lib/auth/roles'
import { EVENTS } from '@/lib/constants'
import { revalidatePath } from 'next/cache'

const EVENT_NAME = EVENTS.RUN

async function requireRunManager() {
  const user = await getCurrentUser()
  if (!user || !canManageEvent(user.role_type, EVENT_NAME)) throw new Error('Unauthorized')
  return user
}

const VALID_STATUSES = ['upcoming', 'active', 'completed'] as const
type EventStatus = typeof VALID_STATUSES[number]

export async function updateRunStatus(formData: FormData) {
  await requireRunManager()
  const status = formData.get('status') as string
  if (!VALID_STATUSES.includes(status as EventStatus)) throw new Error('Invalid status')
  const supabase = await createClient()
  await supabase.from('events').update({ status }).eq('name', EVENT_NAME)
  revalidatePath('/5k-run')
}

export async function addDivision(formData: FormData) {
  await requireRunManager()
  const event_id = formData.get('event_id') as string
  const name     = formData.get('name') as string
  const type     = (formData.get('type') as string) || 'run'
  const supabase = await createClient()
  await supabase.from('divisions').insert({ name, type, parent_event_id: event_id })
  revalidatePath('/5k-run')
}

export async function addRunMilestone(formData: FormData) {
  const user        = await requireRunManager()
  const event_id    = formData.get('event_id') as string
  const title       = formData.get('title') as string
  const description = (formData.get('description') as string) || null
  const date        = formData.get('date') as string
  const supabase    = await createClient()
  await supabase.from('event_milestones').insert({ event_id, title, description, date, created_by: user.id })
  revalidatePath('/5k-run')
}

export async function addRunTask(formData: FormData) {
  await requireRunManager()
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
  revalidatePath('/5k-run')
}
