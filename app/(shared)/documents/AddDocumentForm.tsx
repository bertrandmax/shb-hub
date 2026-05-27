'use client'

import { useState, useRef } from 'react'
import { addDocument } from './actions'

const SCOPE_TYPE_OPTIONS = [
  { value: 'global',      label: 'Global' },
  { value: 'event',       label: 'Event' },
  { value: 'competition', label: 'Competition' },
  { value: 'division',    label: 'Division' },
]

const INPUT_CLS = 'rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0] w-full'
const LABEL_CLS = 'text-xs font-semibold font-mono uppercase tracking-wide text-slate-500'

export function AddDocumentForm() {
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSubmitting(true)
    try {
      const form = e.currentTarget
      const formData = new FormData(form)
      const file = formData.get('file') as File | null

      let fileUrl = (formData.get('file_url') as string).trim()

      if (file && file.size > 0) {
        setUploading(true)
        const uploadForm = new FormData()
        uploadForm.set('file', file)
        try {
          const res = await fetch('/api/upload', { method: 'POST', body: uploadForm })
          const json = await res.json()
          if (!res.ok) { setError(json.error ?? 'Upload failed'); return }
          fileUrl = json.url
        } catch {
          setError('Upload failed. Please try again.')
          return
        }
      }

      if (!fileUrl) { setError('Provide a file or a URL.'); return }

      const submitData = new FormData()
      submitData.set('name', formData.get('name') as string)
      submitData.set('file_url', fileUrl)
      submitData.set('scope_type', formData.get('scope_type') as string)
      submitData.set('scope_id', formData.get('scope_id') as string)

      try {
        await addDocument(submitData)
        setSuccess(true)
        formRef.current?.reset()
      } catch {
        setError('Failed to save document. Please try again.')
      }
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  return (
    <details>
      <summary className="cursor-pointer text-xs font-mono font-semibold uppercase tracking-widest text-[#1d3fa0] hover:text-[#1a3690] select-none">
        + Add Document
      </summary>
      <form ref={formRef} onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {error && (
          <div className="sm:col-span-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 font-mono">{error}</div>
        )}
        {success && (
          <div className="sm:col-span-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 font-mono">Document added.</div>
        )}

        <div className="sm:col-span-2 flex flex-col gap-1">
          <label className={LABEL_CLS}>Document Name</label>
          <input name="name" type="text" required placeholder="e.g. Budget Spreadsheet Q1" className={INPUT_CLS} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL_CLS}>Upload File</label>
          <input
            name="file"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.csv"
            className="rounded-lg border border-[#dde3ef] bg-white px-3 py-1.5 text-sm font-body text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0] w-full file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#1d3fa0] file:text-white file:text-xs file:font-semibold cursor-pointer"
          />
          <p className="text-[10px] font-mono text-slate-400">Max 50MB. PDF, Word, Excel, PPT, image, CSV.</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL_CLS}>Or Paste URL</label>
          <input name="file_url" type="url" placeholder="https://…" className={INPUT_CLS} />
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

        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center font-semibold rounded-xl transition-colors font-body px-4 py-2.5 text-sm bg-[#1d3fa0] hover:bg-[#1a3690] text-white disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : submitting ? 'Saving…' : 'Add Document'}
          </button>
        </div>
      </form>
    </details>
  )
}
