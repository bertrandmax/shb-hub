import { cn } from '@/lib/utils'

export function Card({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('bg-white border border-[#dde3ef] rounded-xl p-5', className)}>
      {children}
    </div>
  )
}
