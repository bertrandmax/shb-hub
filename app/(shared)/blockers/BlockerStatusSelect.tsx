'use client'

import { useTransition } from 'react'
import { updateBlockerStatus } from './actions'

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved'] as const

export function BlockerStatusSelect({ id, currentStatus }: { id: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <select
      defaultValue={currentStatus}
      disabled={isPending}
      onChange={(e) => {
        const status = e.currentTarget.value
        startTransition(() => updateBlockerStatus(id, status))
      }}
      className="text-xs font-mono font-semibold rounded-lg border border-[#dde3ef] px-2 py-1 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0] disabled:opacity-50"
    >
      {STATUS_OPTIONS.map(st => (
        <option key={st} value={st}>{st.replace('_', ' ')}</option>
      ))}
    </select>
  )
}
