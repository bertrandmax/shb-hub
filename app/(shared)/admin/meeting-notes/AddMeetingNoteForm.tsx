'use client'

import { useState, useRef } from 'react'
import { addMeetingNote } from './actions'

const SCOPE_TYPE_OPTIONS = [
  { value: 'global',      label: 'Global' },
  { value: 'event',       label: 'Event' },
  { value: 'competition', label: 'Competition' },
  { value: 'division',    label: 'Division' },
]

const INPUT_CLS = 'rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0] w-full'
const LABEL_CLS = 'text-xs font-semibold font-mono uppercase tracking-wide text-slate-500'

export function AddMeetingNoteForm() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const form = e.currentTarget
    const formData = new FormData(form)
    const file = formData.get('attachment_file') as File | null

    let attachmentUrl = ''

    if (file && file.size > 0) {
      setUploading(true)
      const uploadForm = new FormData()
      uploadForm.set('file', file)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: uploadForm })
        const json = await res.json()
        if (!res.ok) { setError(json.error ?? 'Upload failed'); setUploading(false); return }
        attachmentUrl = json.url
      } catch {
        setError('Upload failed. Please try again.')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    const submitData = new FormData()
    submitData.set('title', formData.get('title') as string)
    submitData.set('body', formData.get('body') as string)
    submitData.set('scope_type', formData.get('scope_type') as string)
    submitData.set('scope_id', formData.get('scope_id') as string)
    if (attachmentUrl) submitData.set('attachment_url', attachmentUrl)

    await addMeetingNote(submitData)
    setSuccess(true)
    formRef.current?.reset()
  }

  return (
    <details>
      <summary className="cursor-pointer text-xs font-mono font-semibold uppercase tracking-widest text-[#1d3fa0] hover:text-[#1a3690] select-none">
        + Add Meeting Note
      </summary>
      <form ref={formRef} onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {error && (
          <div className="sm:col-span-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 font-mono">{error}</div>
        )}
        {success && (
          <div className="sm:col-span-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 font-mono">Note saved.</div>
        )}

        <div className="sm:col-span-2 flex flex-col gap-1">
          <label className={LABEL_CLS}>Title</label>
          <input name="title" type="text" required placeholder="e.g. Weekly Sync – 20 May 2026" className={INPUT_CLS} />
        </div>

        <div className="sm:col-span-2 flex flex-col gap-1">
          <label className={LABEL_CLS}>Notes</label>
          <textarea
            name="body"
            rows={5}
            placeholder="Meeting notes, decisions, action items…"
            className="rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 resize-none placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]"
          />
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
          <input name="scope_id" type="text" placeholder="e.g. event UUID" className={INPUT_CLS} />
        </div>

        <div className="sm:col-span-2 flex flex-col gap-1">
          <label className={LABEL_CLS}>Attachment (optional)</label>
          <input
            name="attachment_file"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.csv"
            className="rounded-lg border border-[#dde3ef] bg-white px-3 py-1.5 text-sm font-body text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0] w-full file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#1d3fa0] file:text-white file:text-xs file:font-semibold cursor-pointer"
          />
          <p className="text-[10px] font-mono text-slate-400">Max 50MB. Optional file to attach to this note.</p>
        </div>

        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center justify-center font-semibold rounded-xl transition-colors font-body px-4 py-2.5 text-sm bg-[#1d3fa0] hover:bg-[#1a3690] text-white disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Save Note'}
          </button>
        </div>
      </form>
    </details>
  )
}
