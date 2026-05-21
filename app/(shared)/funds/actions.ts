'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { isProjectManager } from '@/lib/auth/roles'
import { revalidatePath } from 'next/cache'

export async function createBudgetRequest(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthenticated')

  const title      = formData.get('title') as string
  const amount     = Number(formData.get('amount')) || 0
  const reason     = (formData.get('reason') as string) || null
  const scope_type = (formData.get('scope_type') as string) || null
  const scope_id   = (formData.get('scope_id') as string) || null

  await supabase.from('budget_requests').insert({
    title,
    amount,
    reason,
    scope_type: scope_type || null,
    scope_id: scope_id || null,
    status: 'pending',
    requested_by: user.id,
  })

  revalidatePath('/funds')
}

export async function approveBudgetRequest(id: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user || !isProjectManager(user.role_type)) throw new Error('Unauthorized')
  await supabase.from('budget_requests').update({ status: 'approved' }).eq('id', id)
  revalidatePath('/funds')
}

export async function rejectBudgetRequest(id: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user || !isProjectManager(user.role_type)) throw new Error('Unauthorized')
  await supabase.from('budget_requests').update({ status: 'rejected' }).eq('id', id)
  revalidatePath('/funds')
}
