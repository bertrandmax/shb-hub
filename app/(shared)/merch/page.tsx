import { getCurrentUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function MerchPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [{ data: merch }, { data: tickets }] = await Promise.all([
    supabase
      .from('merch_items')
      .select('id, name, price, stock_total, stock_sold, events(name)')
      .order('name', { ascending: true }),
    supabase
      .from('ticket_sales')
      .select('id, ticket_type, price, quantity_sold, revenue, events(name)')
      .order('ticket_type', { ascending: true }),
  ])

  const merchItems  = (merch   ?? []) as any[]
  const ticketSales = (tickets ?? []) as any[]

  const totalTicketRevenue = ticketSales.reduce((sum: number, t: any) => sum + (t.revenue ?? 0), 0)

  return (
    <AppShell user={user}>
      <div className="max-w-5xl space-y-8">
        {/* Header */}
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1d3fa0]">
          Merch & Tickets
        </h1>

        {/* Merchandise Section */}
        <section className="space-y-3">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-400">Merchandise</p>
          <Card>
            {merchItems.length === 0 ? (
              <p className="text-sm text-slate-400 font-mono py-4 text-center">No merchandise items.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#dde3ef]">
                      <th className="text-left py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Item</th>
                      <th className="text-left py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Event</th>
                      <th className="text-right py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Price</th>
                      <th className="text-right py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Total</th>
                      <th className="text-right py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Sold</th>
                      <th className="text-right py-2 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {merchItems.map((item) => {
                      const remaining = (item.stock_total ?? 0) - (item.stock_sold ?? 0)
                      return (
                        <tr key={item.id} className="border-b border-[#dde3ef] last:border-0">
                          <td className="py-3 pr-4 font-semibold text-slate-800">{item.name}</td>
                          <td className="py-3 pr-4 text-slate-500 text-xs font-mono">{item.events?.name ?? '—'}</td>
                          <td className="py-3 pr-4 text-right font-mono text-slate-700">${fmt(item.price ?? 0)}</td>
                          <td className="py-3 pr-4 text-right font-mono text-slate-500">{item.stock_total ?? 0}</td>
                          <td className="py-3 pr-4 text-right font-mono text-slate-500">{item.stock_sold ?? 0}</td>
                          <td className={`py-3 text-right font-mono font-semibold ${remaining <= 0 ? 'text-red-600' : remaining < 10 ? 'text-[#a07020]' : 'text-green-700'}`}>
                            {remaining}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>

        {/* Ticket Sales Section */}
        <section className="space-y-3">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-400">Ticket Sales</p>
          <Card>
            {ticketSales.length === 0 ? (
              <p className="text-sm text-slate-400 font-mono py-4 text-center">No ticket sales recorded.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#dde3ef]">
                        <th className="text-left py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Type</th>
                        <th className="text-left py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Event</th>
                        <th className="text-right py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Price</th>
                        <th className="text-right py-2 pr-4 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Qty Sold</th>
                        <th className="text-right py-2 text-xs font-mono uppercase tracking-widest text-slate-400 font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ticketSales.map((t) => (
                        <tr key={t.id} className="border-b border-[#dde3ef] last:border-0">
                          <td className="py-3 pr-4 font-semibold text-slate-800">{t.ticket_type}</td>
                          <td className="py-3 pr-4 text-slate-500 text-xs font-mono">{t.events?.name ?? '—'}</td>
                          <td className="py-3 pr-4 text-right font-mono text-slate-700">${fmt(t.price ?? 0)}</td>
                          <td className="py-3 pr-4 text-right font-mono text-slate-500">{t.quantity_sold ?? 0}</td>
                          <td className="py-3 text-right font-mono font-semibold text-[#1d3fa0]">${fmt(t.revenue ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total Revenue */}
                <div className="mt-4 pt-3 border-t border-[#dde3ef] flex justify-end items-center gap-3">
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Total Revenue</span>
                  <span className="font-display text-xl font-black text-[#1d3fa0]">${fmt(totalTicketRevenue)}</span>
                </div>
              </>
            )}
          </Card>
        </section>
      </div>
    </AppShell>
  )
}
