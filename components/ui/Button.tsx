import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-xl cursor-pointer',
        'font-body transition-all duration-150 ease-out',
        'active:scale-[0.97] active:brightness-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        size === 'md' && 'px-4 py-2.5 text-sm gap-1.5',
        size === 'sm' && 'px-3 py-1.5 text-xs gap-1',
        variant === 'primary' && 'bg-[#1d3fa0] hover:bg-[#1a3690] text-white shadow-sm hover:shadow',
        variant === 'ghost'   && 'bg-transparent hover:bg-[#dce7ff] text-[#1d3fa0]',
        variant === 'danger'  && 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
