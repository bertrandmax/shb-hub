'use client'

import { useTransition } from 'react'
import { toggleVolunteerConfirmed } from './actions'

export function VolunteerConfirmToggle({ id, confirmed }: { id: string; confirmed: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(() => toggleVolunteerConfirmed(id, !confirmed))
      }}
      className={[
        'text-xs font-mono font-semibold rounded-lg border px-2 py-1 cursor-pointer transition-colors disabled:opacity-50',
        confirmed
          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
          : 'bg-slate-50 text-slate-500 border-[#dde3ef] hover:border-[#1d3fa0] hover:text-[#1d3fa0]',
      ].join(' ')}
    >
      {isPending ? '…' : confirmed ? 'Confirmed' : 'Unconfirmed'}
    </button>
  )
}
