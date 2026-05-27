'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/get-user'
import { isProjectManager } from '@/lib/auth/roles'

function canManageSponsors(role: string) {
  return role === 'project_manager' || role === 'marketing_head'
}

function canLogInteraction(role: string) {
  return ['project_manager', 'marketing_head', 'shb_cup_pm', '5k_run_pm'].includes(role)
}

export async function addSponsor(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !canManageSponsors(user.role_type)) throw new Error('Unauthorized')

  const supabase = await createClient()

  const company_name       = formData.get('company_name') as string
  const contact_name       = (formData.get('contact_name') as string) || null
  const contact_email      = (formData.get('contact_email') as string) || null
  const status             = (formData.get('status') as string) || 'prospect'
  const amount_pledged     = formData.get('amount_pledged') ? Number(formData.get('amount_pledged')) : null
  const next_followup_date = (formData.get('next_followup_date') as string) || null
  const notes              = (formData.get('notes') as string) || null

  await supabase.from('sponsors').insert({
    company_name, contact_name, contact_email, status, amount_pledged, next_followup_date, notes,
  })

  revalidatePath('/sponsors')
}

export async function updateSponsorStatus(id: string, status: string) {
  const user = await getCurrentUser()
  if (!user || !canManageSponsors(user.role_type)) throw new Error('Unauthorized')
  const supabase = await createClient()
  await supabase.from('sponsors').update({ status }).eq('id', id)
  revalidatePath('/sponsors')
}

export async function updateAmountReceived(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !canManageSponsors(user.role_type)) throw new Error('Unauthorized')
  const id  = formData.get('id') as string
  const val = Number(formData.get('amount_received'))
  if (isNaN(val) || val < 0) throw new Error('Invalid amount')
  const supabase = await createClient()
  await supabase.from('sponsors').update({ amount_received: val }).eq('id', id)
  revalidatePath('/sponsors')
}

export async function logInteraction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !canLogInteraction(user.role_type)) throw new Error('Unauthorized')
  const sponsor_id       = formData.get('sponsor_id') as string
  const interaction_type = formData.get('interaction_type') as string
  const notes            = (formData.get('notes') as string) || null
  const date             = (formData.get('date') as string) || new Date().toISOString().slice(0, 10)
  const supabase         = await createClient()
  await supabase.from('sponsor_interactions').insert({
    sponsor_id, logged_by: user.id, interaction_type, notes, date,
  })
  revalidatePath('/sponsors')
}

export async function addDeliverable(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !canManageSponsors(user.role_type)) throw new Error('Unauthorized')
  const sponsor_id  = formData.get('sponsor_id') as string
  const description = formData.get('description') as string
  const type        = formData.get('type') as string
  const due_date    = (formData.get('due_date') as string) || null
  const supabase    = await createClient()
  await supabase.from('sponsor_deliverables').insert({
    sponsor_id, description, type, due_date, status: 'pending',
  })
  revalidatePath('/sponsors')
}

export async function updateDeliverableStatus(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !canManageSponsors(user.role_type)) throw new Error('Unauthorized')
  const id           = formData.get('id') as string
  const status       = formData.get('status') as string
  const fulfilled_at = status === 'fulfilled' ? new Date().toISOString() : null
  const supabase     = await createClient()
  await supabase.from('sponsor_deliverables').update({ status, fulfilled_at }).eq('id', id)
  revalidatePath('/sponsors')
}
