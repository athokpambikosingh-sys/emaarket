'use client'

import { formatDate, formatINR } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { OrderStatus } from '@/lib/types'
import { ORDER_STEPS, StatusBadge } from './order-progress'

export function ArtisanOrders({ artisanId }: { artisanId: string }) {
  const { orders, getProduct, updateOrderStatus } = useStore()
  const myOrders = orders.filter((o) => o.items.some((i) => (i.artisanId || getProduct(i.productId)?.artisanId) === artisanId))

  if (myOrders.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">No orders yet.</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Order</th>
            <th scope="col" className="px-4 py-3 font-medium">Customer</th>
            <th scope="col" className="px-4 py-3 font-medium">Items</th>
            <th scope="col" className="px-4 py-3 font-medium">Your share</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 font-medium">Update</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {myOrders.map((o) => {
            const mine = o.items.filter((i) => (i.artisanId || getProduct(i.productId)?.artisanId) === artisanId)
            const share = mine.reduce((s, i) => s + i.price * i.quantity, 0)
            return (
              <tr key={o.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{o.id}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(o.date)}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{o.customerName}</p>
                  <p className="text-xs text-muted-foreground">{o.city}</p>
                </td>
                <td className="px-4 py-3">
                  {mine.map((i) => (
                    <p key={i.orderItemId || i.productId} className="max-w-56 truncate">
                      {i.quantity} × {getProduct(i.productId)?.name}
                    </p>
                  ))}
                </td>
                <td className="px-4 py-3 font-medium">{formatINR(share)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3">
                  <label htmlFor={`status-${o.id}`} className="sr-only">
                    Update status for {o.id}
                  </label>
                  <select
                    id={`status-${o.id}`}
                    value={o.status}
                    onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                    className="h-9 rounded-md border border-input bg-card px-2 text-sm"
                  >
                    {ORDER_STEPS.filter((s) => s !== 'Pending').map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
