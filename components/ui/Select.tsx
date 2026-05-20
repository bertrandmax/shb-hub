import { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'rounded-lg border border-[#dde3ef] bg-white px-3 py-2 text-sm font-body text-slate-800',
          'focus:outline-none focus:ring-2 focus:ring-[#1d3fa0]/30 focus:border-[#1d3fa0]',
          'disabled:bg-slate-50 disabled:cursor-not-allowed',
          error && 'border-red-400 focus:ring-red-400/30',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 font-mono">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'
