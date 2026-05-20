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
        'inline-flex items-center justify-center font-semibold rounded-xl transition-colors font-body',
        size === 'md' && 'px-4 py-2.5 text-sm',
        size === 'sm' && 'px-3 py-1.5 text-xs',
        variant === 'primary' && 'bg-[#1d3fa0] hover:bg-[#1a3690] text-white',
        variant === 'ghost'   && 'bg-transparent hover:bg-[#dce7ff] text-[#1d3fa0]',
        variant === 'danger'  && 'bg-red-600 hover:bg-red-700 text-white',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
