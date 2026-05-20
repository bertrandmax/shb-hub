import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800',
          'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]',
          'disabled:bg-slate-50 disabled:cursor-not-allowed',
          error && 'border-red-400 focus:ring-red-400/30',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 font-mono">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'
