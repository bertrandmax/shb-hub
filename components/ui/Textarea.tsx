import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 resize-none',
          'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]',
          error && 'border-red-400 focus:ring-red-400/30',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 font-mono">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'
