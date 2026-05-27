'use client'

import { useState } from 'react'
import { logInteraction, addDeliverable, updateDeliverableStatus, updateAmountReceived } from './actions'

interface Interaction {
  id: string
  interaction_type: string
  notes: string | null
  date: string
  users?: { name: string } | null
}

interface Deliverable {
  id: string
  description: string
  type: string
  status: string
  due_date: string | null
}

interface Sponsor {
  id: string
  company_name: string
  contact_name: string | null
  contact_email: string | null
  status: string
  amount_pledged: number | null
  amount_received: number | null
  next_followup_date: string | null
  notes: string | null
}

interface Props {
  sponsor: Sponsor
  interactions: Interaction[]
  deliverables: Deliverable[]
  isPM: boolean
  canLog: boolean
  statusCell: React.ReactNode
  fmtAmount: (v: number | null) => string
}

const INPUT_CLS = 'rounded-lg border border-[#dde3ef] bg-white px-2 py-1.5 text-sm font-body text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]'

export function SponsorRow({ sponsor, interactions, deliverables, isPM, canLog, statusCell, fmtAmount }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <tr
        className="hover:bg-[#f0f2f8]/60 transition-colors cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <td className="px-4 py-3 font-semibold text-slate-800">
          <span>{sponsor.company_name}</span>
          <span className="ml-1.5 text-[10px] font-mono text-slate-400">{open ? '▲' : '▼'}</span>
        </td>
        <td className="px-4 py-3 text-slate-600">
          <div>{sponsor.contact_name ?? '—'}</div>
          {sponsor.contact_email && (
            <div className="text-xs font-mono text-slate-400">{sponsor.contact_email}</div>
          )}
        </td>
        <td className="px-4 py-3">{statusCell}</td>
        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">{fmtAmount(sponsor.amount_pledged)}</td>
        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">{fmtAmount(sponsor.amount_received)}</td>
        <td className="px-4 py-3 font-mono text-xs text-slate-500">
          {sponsor.next_followup_date
            ? new Date(sponsor.next_followup_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'}
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={6} className="bg-[#f8f9fd] border-b border-[#dde3ef] px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Notes */}
              {sponsor.notes && (
                <div className="md:col-span-2">
                  <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-1">Notes</p>
                  <p className="text-sm text-slate-600">{sponsor.notes}</p>
                </div>
              )}

              {/* Amount Received Edit (PM only) */}
              {isPM && (
                <div>
                  <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-2">Update Received (MYR)</p>
                  <form action={updateAmountReceived} className="flex gap-2 items-center">
                    <input type="hidden" name="id" value={sponsor.id} />
                    <input
                      name="amount_received"
                      type="number"
                      defaultValue={sponsor.amount_received ?? 0}
                      min={0}
                      step={0.01}
                      className={INPUT_CLS + ' w-40'}
                    />
                    <button type="submit" className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1d3fa0] text-white hover:bg-[#1a3690]">
                      Save
                    </button>
                  </form>
                </div>
              )}

              {/* Interactions */}
              <div>
                <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-2">
                  Interactions ({interactions.length})
                </p>
                {interactions.length > 0 && (
                  <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
                    {interactions.map((i) => (
                      <div key={i.id} className="flex gap-2 text-xs font-mono text-slate-600">
                        <span className="text-slate-400 shrink-0">{i.date}</span>
                        <span className="font-semibold capitalize">{i.interaction_type}</span>
                        {i.notes && <span className="text-slate-500 truncate">{i.notes}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {interactions.length === 0 && (
                  <p className="text-xs font-mono text-slate-400 mb-3">No interactions yet.</p>
                )}
                {canLog && (
                  <form action={logInteraction} className="flex flex-wrap gap-2 items-end">
                    <input type="hidden" name="sponsor_id" value={sponsor.id} />
                    <select name="interaction_type" className={INPUT_CLS}>
                      <option value="call">Call</option>
                      <option value="email">Email</option>
                      <option value="meeting">Meeting</option>
                    </select>
                    <input
                      name="date"
                      type="date"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      className={INPUT_CLS}
                    />
                    <input name="notes" type="text" placeholder="Notes…" className={INPUT_CLS + ' flex-1 min-w-32'} />
                    <button type="submit" className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1d3fa0] text-white hover:bg-[#1a3690]">
                      Log
                    </button>
                  </form>
                )}
              </div>

              {/* Deliverables */}
              <div>
                <p className="text-xs font-mono font-medium uppercase tracking-widest text-slate-400 mb-2">
                  Deliverables ({deliverables.length})
                </p>
                {deliverables.length > 0 && (
                  <div className="space-y-1.5 mb-3 max-h-40 overflow-y-auto">
                    {deliverables.map((d) => (
                      <div key={d.id} className="flex items-center gap-2 text-xs font-mono">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${d.status === 'fulfilled' ? 'bg-green-500' : 'bg-amber-400'}`} />
                        <span className="text-slate-600 flex-1 truncate">{d.description}</span>
                        <span className="text-slate-400 capitalize shrink-0">{d.type.replace('_', ' ')}</span>
                        {isPM && d.status === 'pending' && (
                          <form action={updateDeliverableStatus}>
                            <input type="hidden" name="id" value={d.id} />
                            <input type="hidden" name="status" value="fulfilled" />
                            <button type="submit" className="text-green-700 hover:underline text-[10px]">Mark done</button>
                          </form>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {deliverables.length === 0 && (
                  <p className="text-xs font-mono text-slate-400 mb-3">No deliverables yet.</p>
                )}
                {isPM && (
                  <form action={addDeliverable} className="flex flex-wrap gap-2 items-end">
                    <input type="hidden" name="sponsor_id" value={sponsor.id} />
                    <input
                      name="description"
                      type="text"
                      required
                      placeholder="e.g. Logo on banner"
                      className={INPUT_CLS + ' flex-1 min-w-32'}
                    />
                    <select name="type" className={INPUT_CLS}>
                      <option value="logo_placement">Logo</option>
                      <option value="booth">Booth</option>
                      <option value="shoutout">Shoutout</option>
                      <option value="other">Other</option>
                    </select>
                    <input name="due_date" type="date" className={INPUT_CLS} />
                    <button type="submit" className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1d3fa0] text-white hover:bg-[#1a3690]">Add</button>
                  </form>
                )}
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  )
}
