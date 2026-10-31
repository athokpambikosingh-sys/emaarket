'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Package } from 'lucide-react'
import { formatDate, formatINR } from '@/lib/format'
import { useStore } from '@/lib/store'
import { ProductCard } from '../product-card'
import { buttonClass } from '../shared'
import { OrderProgress, StatCard, StatusBadge } from './order-progress'

export function CustomerDashboard() {
  const { orders, getProduct, wishlist, products, conversations, bulkRequests, currentUser, loading } = useStore()
  const myOrders = orders
  const myConversations = conversations
  const unread = myConversations.filter((c) => c.unread).length
  const myBulk = bulkRequests
  const saved = products.filter((p) => wishlist.includes(p.id)).slice(0, 4)
  const spent = myOrders.reduce((s, o) => s + o.total, 0)

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-muted-foreground" role="status" aria-live="polite">Loading your account…</div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">My account</p>
        <h1 className="text-4xl font-semibold md:text-5xl">Khurumjari, {currentUser?.name.split(' ')[0] || 'friend'}</h1>
        <p className="text-muted-foreground">Track orders, revisit saved pieces and keep up with your artisans.</p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Orders" value={String(myOrders.length)} hint={`${formatINR(spent)} supporting artisans`} />
        <StatCard label="Wishlist" value={String(wishlist.length)} hint="Saved pieces" />
        <StatCard label="Conversations" value={String(myConversations.length)} hint={`${unread} unread`} />
        <StatCard label="Bulk requests" value={String(myBulk.length)} hint="Custom & bulk" />
      </div>

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-semibold">Order history</h2>
          <Link href="/shop" className="text-sm font-medium text-primary hover:underline">
            Continue shopping
          </Link>
        </div>
        {myOrders.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-border p-10 text-center">
            <Package className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">You haven&apos;t placed any orders yet.</p>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-4">
            {myOrders.map((o) => (
              <li key={o.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{o.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(o.date)} · Shipping to {o.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <span className="font-semibold">{formatINR(o.total)}</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-5 md:grid-cols-[1fr_360px] md:items-center">
                  <ul className="flex flex-wrap gap-3">
                    {o.items.map((item) => {
                      const p = getProduct(item.productId)
                      return (
                        <li key={item.productId}>
                          <Link href={p ? `/products/${p.slug}` : '/shop'} className="flex items-center gap-3 rounded-lg bg-muted/60 p-2 pr-4 hover:bg-muted">
                            <div className="relative size-12 overflow-hidden rounded-md">
                              <Image src={p?.image || item.productImageUrl || '/placeholder.svg'} alt="" fill sizes="48px" className="object-cover" />
                            </div>
                            <div className="text-sm">
                              <p className="max-w-48 truncate font-medium">{p?.name || item.productName || 'Product'}</p>
                              <p className="text-xs text-muted-foreground">
                                Qty {item.quantity} · {formatINR(item.price)}
                              </p>
                            </div>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                  <OrderProgress status={o.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-3xl font-semibold">Bulk & custom requests</h2>
        {myBulk.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No requests yet.</p> : <ul className="mt-5 grid gap-3 md:grid-cols-2">{myBulk.map((request) => <li key={request.id} className="rounded-xl border border-border bg-card p-5"><div className="flex justify-between gap-3"><p className="font-medium">{request.business || 'Custom request'}</p><StatusBadge status={request.status === 'Accepted' ? 'Delivered' : request.status === 'Quoted' ? 'Processing' : 'Pending'} /></div><p className="mt-1 text-xs text-muted-foreground">{request.quantity} pieces · Needed by {formatDate(request.deadline)}</p><p className="mt-3 text-sm">{request.customization}</p>{request.responseAmount && <p className="mt-3 rounded-lg bg-secondary p-3 text-sm"><strong>Artisan quote: {formatINR(request.responseAmount)} per piece.</strong> {request.responseNote}</p>}</li>)}</ul>}
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-semibold">Saved for later</h2>
          <Link href="/wishlist" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Full wishlist <ArrowRight className="size-4" />
          </Link>
        </div>
        {saved.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {saved.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">Nothing saved yet.</p>
        )}
      </section>

      <section className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl bg-secondary p-6 pattern-weave md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-semibold">Have something special in mind?</h2>
          <p className="text-sm text-muted-foreground">Request a custom piece or a bulk order directly from artisans.</p>
        </div>
        <Link href="/bulk-orders" className={buttonClass.primary}>
          Start a request
        </Link>
      </section>
    </div>
  )
}
