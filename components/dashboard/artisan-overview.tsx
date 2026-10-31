'use client'

import { AlertTriangle } from 'lucide-react'
import { formatDate, formatINR } from '@/lib/format'
import { useStore } from '@/lib/store'
import { StatCard, StatusBadge } from './order-progress'

type Tab = 'Overview' | 'Products' | 'Orders' | 'Messages' | 'Bulk requests'

export function ArtisanOverview({ artisanId, onNavigate }: { artisanId: string; onNavigate: (t: Tab) => void }) {
  const { products, orders, getProduct } = useStore()
  const listings = products.filter((p) => p.artisanId === artisanId)
  const myOrders = orders.filter((o) => o.items.some((i) => (i.artisanId || getProduct(i.productId)?.artisanId) === artisanId))
  const revenue = myOrders.filter((order) => !['Cancelled', 'Refunded'].includes(order.status)).reduce(
    (sum, o) =>
      sum +
      o.items
        .filter((i) => (i.artisanId || getProduct(i.productId)?.artisanId) === artisanId)
        .reduce((s, i) => s + i.price * i.quantity, 0),
    0,
  )
  const pending = myOrders.filter((o) => o.status === 'Pending' || o.status === 'Processing').length
  const lowStock = listings.filter((p) => p.stock <= 3)
  const now = new Date()
  const salesByMonth = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const value = myOrders.filter((order) => {
      const date = new Date(order.date)
      return date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth()
    }).reduce((sum, order) => sum + (['Cancelled', 'Refunded'].includes(order.status) ? 0 : order.items.filter((item) => (item.artisanId || getProduct(item.productId)?.artisanId) === artisanId).reduce((part, item) => part + item.price * item.quantity, 0)), 0)
    return { month: monthDate.toLocaleDateString('en-IN', { month: 'short' }), value }
  })
  const maxSale = Math.max(1, ...salesByMonth.map((sale) => sale.value))
  const ratingValues = listings.filter((product) => product.reviews > 0)
  const rating = ratingValues.length ? ratingValues.reduce((sum, product) => sum + product.rating, 0) / ratingValues.length : 0

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatINR(revenue)} hint="From recorded orders" />
        <StatCard label="Active listings" value={String(listings.length)} hint={`${lowStock.length} low on stock`} />
        <StatCard label="Orders to fulfil" value={String(pending)} hint={`${myOrders.length} total orders`} />
        <StatCard label="Avg. rating" value={rating ? rating.toFixed(1) : '—'} hint="From product reviews" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Monthly sales</h2>
          <div className="mt-6 flex h-56 items-end gap-3" role="img" aria-label="Bar chart of monthly sales">
            {salesByMonth.map((s, i) => (
              <div key={s.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[11px] text-muted-foreground">{formatINR(s.value)}</span>
                <div
                  className={i === salesByMonth.length - 1 ? 'w-full rounded-t-md bg-primary' : 'w-full rounded-t-md bg-gold/60'}
                  style={{ height: `${(s.value / maxSale) * 80}%` }}
                />
                <span className="text-xs font-medium">{s.month}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Low stock</h2>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">All listings are well stocked.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <AlertTriangle className="size-4 shrink-0 text-gold" aria-hidden="true" />
                    <span className="truncate">{p.name}</span>
                  </span>
                  <span className="shrink-0 font-medium">{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => onNavigate('Products')} className="mt-4 text-sm font-medium text-primary hover:underline">
            Manage products
          </button>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Recent orders</h2>
          <button type="button" onClick={() => onNavigate('Orders')} className="text-sm font-medium text-primary hover:underline">
            View all
          </button>
        </div>
        <ul className="mt-4 divide-y divide-border">
          {myOrders.slice(0, 4).map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span>
                <span className="font-medium">{o.id}</span>
                <span className="text-muted-foreground">
                  {' '}
                  · {o.customerName} · {formatDate(o.date)}
                </span>
              </span>
              <StatusBadge status={o.status} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
