'use client'

import { useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { inviteUser, type InviteState } from './actions'

const ROLE_LABELS: Record<string, string> = {
  project_manager:              'Project Manager',
  shb_cup_pm:                   'SHB Cup PM',
  shb_cup_vice_pm:              'SHB Cup Vice PM',
  '5k_run_pm':                  '5K Run PM',
  '5k_run_vice_pm':             '5K Run Vice PM',
  competition_coordinator:      'Competition Coordinator',
  competition_vice_coordinator: 'Competition Vice Coordinator',
  competition_pic_head:         'Competition PIC Head',
  competition_pic_vice:         'Competition PIC Vice',
  division_head:                'Division Head',
  division_vice_head:           'Division Vice Head',
  marketing_head:               'Marketing Head',
}

const SCOPE_TYPE_OPTIONS = [
  { value: 'global',      label: 'Global' },
  { value: 'event',       label: 'Event' },
  { value: 'competition', label: 'Competition' },
  { value: 'division',    label: 'Division' },
]

const INPUT_CLS = 'rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0] w-full'
const LABEL_CLS = 'text-xs font-semibold font-mono uppercase tracking-wide text-slate-500'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center font-semibold rounded-xl transition-colors font-body px-4 py-2.5 text-sm bg-[#1d3fa0] hover:bg-[#1a3690] text-white disabled:opacity-50"
    >
      {pending ? 'Sending…' : 'Send Invite'}
    </button>
  )
}

export function InviteUserForm() {
  const [state, action] = useFormState<InviteState, FormData>(inviteUser, {})
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <details>
      <summary className="cursor-pointer text-xs font-mono font-semibold uppercase tracking-widest text-[#1d3fa0] hover:text-[#1a3690] select-none">
        + Invite User
      </summary>

      <form ref={formRef} action={action} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {state.error && (
          <div className="sm:col-span-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 font-mono">
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="sm:col-span-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 font-mono">
            Invite sent successfully.
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className={LABEL_CLS}>Email</label>
          <input name="email" type="email" required placeholder="user@example.com" className={INPUT_CLS} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL_CLS}>Role</label>
          <select name="role_type" required className={INPUT_CLS}>
            <option value="">Select role…</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL_CLS}>Scope Type</label>
          <select name="scope_type" className={INPUT_CLS}>
            <option value="">None</option>
            {SCOPE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL_CLS}>Scope ID</label>
          <input name="scope_id" type="text" placeholder="e.g. event UUID or division slug" className={INPUT_CLS} />
        </div>

        <div className="sm:col-span-2 flex justify-end">
          <SubmitButton />
        </div>
      </form>
    </details>
  )
}
