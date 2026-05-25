import { cn } from '@/lib/utils'

const VARIANTS = {
  blue:   'bg-blue-light text-[#1d3fa0] ring-1 ring-[#1d3fa0]/15',
  gold:   'bg-[#fdf3d8] text-[#a07020] ring-1 ring-[#a07020]/15',
  green:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15',
  red:    'bg-red-50 text-red-700 ring-1 ring-red-600/15',
  slate:  'bg-slate-100 text-slate-500 ring-1 ring-slate-300/60',
}

interface BadgeProps {
  variant?: keyof typeof VARIANTS
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'slate', className, children }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold font-mono tracking-wider uppercase',
      VARIANTS[variant],
      className,
    )}>
      {children}
    </span>
  )
}
