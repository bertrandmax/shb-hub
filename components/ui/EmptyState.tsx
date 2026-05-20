export function EmptyState({ icon, title, description }: {
  icon?: string
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <p className="font-display font-black uppercase text-sm tracking-widest text-slate-400">{title}</p>
      {description && <p className="text-xs text-slate-400 font-mono mt-1">{description}</p>}
    </div>
  )
}
