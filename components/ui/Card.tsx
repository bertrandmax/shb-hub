import { cn } from '@/lib/utils'

export function Card({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn(
      'bg-white border border-[#e2e8f4] rounded-xl p-5 shadow-card',
      className,
    )}>
      {children}
    </div>
  )
}
