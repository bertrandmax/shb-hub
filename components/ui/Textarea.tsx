import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-400">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800 resize-none',
          'placeholder:text-slate-400/70',
          'transition-all duration-150 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/25 focus:border-[#1d3fa0]',
          'hover:border-[#c4cde0]',
          error && 'border-red-400 focus:ring-red-400/25',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 font-mono">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'
