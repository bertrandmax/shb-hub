'use client'

import { useTransition } from 'react'
import { updateSponsorStatus } from './actions'

const STATUS_OPTIONS = ['prospect', 'contacted', 'committed', 'declined'] as const

export function SponsorStatusSelect({ id, currentStatus }: { id: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <select
      defaultValue={currentStatus}
      disabled={isPending}
      onChange={(e) => {
        const status = e.currentTarget.value
        startTransition(() => updateSponsorStatus(id, status))
      }}
      className="text-xs font-mono font-semibold rounded-lg border border-[#dde3ef] px-2 py-1 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0] disabled:opacity-50"
    >
      {STATUS_OPTIONS.map(st => (
        <option key={st} value={st}>{st}</option>
      ))}
    </select>
  )
}
