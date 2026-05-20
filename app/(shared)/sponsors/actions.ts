'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addSponsor(formData: FormData) {
  const supabase = await createClient()

  const company_name       = formData.get('company_name') as string
  const contact_name       = (formData.get('contact_name') as string) || null
  const contact_email      = (formData.get('contact_email') as string) || null
  const status             = (formData.get('status') as string) || 'prospect'
  const amount_pledged     = formData.get('amount_pledged') ? Number(formData.get('amount_pledged')) : null
  const next_followup_date = (formData.get('next_followup_date') as string) || null
  const notes              = (formData.get('notes') as string) || null

  await supabase.from('sponsors').insert({
    company_name,
    contact_name,
    contact_email,
    status,
    amount_pledged,
    next_followup_date,
    notes,
  })

  revalidatePath('/sponsors')
}

export async function updateSponsorStatus(id: string, status: string) {
  const supabase = await createClient()
  await supabase.from('sponsors').update({ status }).eq('id', id)
  revalidatePath('/sponsors')
}
