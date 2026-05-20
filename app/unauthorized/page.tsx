import Link from 'next/link'
import type { Route } from 'next'
import { Button } from '@/components/ui/Button'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[#1d3fa0] mb-3">
          Access Denied
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          You don't have permission to view this page.
        </p>
        <Link href={"/dashboard" as Route}>
          <Button variant="ghost">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
