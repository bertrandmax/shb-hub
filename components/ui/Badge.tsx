import { cn } from '@/lib/utils'

const VARIANTS = {
  blue:   'bg-[#dce7ff] text-[#1d3fa0]',
  gold:   'bg-[#fdf3d8] text-[#a07020]',
  green:  'bg-green-100 text-green-800',
  red:    'bg-red-100 text-red-700',
  slate:  'bg-slate-100 text-slate-600',
}

interface BadgeProps {
  variant?: keyof typeof VARIANTS
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'slate', className, children }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono tracking-wide uppercase',
      VARIANTS[variant],
      className,
    )}>
      {children}
    </span>
  )
}
