export default function Loading() {
  return (
    <div className="fixed inset-x-0 top-0 h-0.5 z-50 overflow-hidden">
      <div className="absolute h-full w-1/3 bg-blue animate-nav-progress" />
    </div>
  )
}
