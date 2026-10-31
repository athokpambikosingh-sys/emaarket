'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { formatINR } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { Order } from '@/lib/types'
import { cn } from '@/lib/utils'
import { buttonClass, inputClass } from '../shared'

const FREE_SHIPPING = 2500
const SHIPPING_FEE = 120
export function CartView() {
  const { cart, getProduct, getArtisan, updateCartQuantity, removeFromCart, placeOrder, currentUser, loading } = useStore()
  const [placed, setPlaced] = useState<Order | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)

  const lines = cart
    .map((item) => ({ item, product: getProduct(item.productId) }))
    .filter((l): l is { item: typeof l.item; product: NonNullable<typeof l.product> } => Boolean(l.product))
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.item.quantity, 0)
  const shipping = subtotal >= FREE_SHIPPING || subtotal === 0 ? 0 : SHIPPING_FEE
  const total = subtotal + shipping

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-24 text-center text-sm text-muted-foreground" role="status" aria-live="polite">Loading your cart…</div>

  async function onCheckout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCheckingOut(true)
    const form = new FormData(e.currentTarget)
    try {
      const order = await placeOrder({ name: String(form.get('name')), phone: String(form.get('phone')), address: String(form.get('address')), city: String(form.get('city')), pin: String(form.get('pin')) })
      if (order) setPlaced(order)
    } finally { setCheckingOut(false) }
  }

  if (placed) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <CheckCircle2 className="size-14 text-gold" aria-hidden="true" />
        <h1 className="mt-6 text-4xl font-semibold">Thank you, your order is placed</h1>
        <p className="mt-3 text-muted-foreground">
          Order <span className="font-medium text-foreground">{placed.id}</span> for {formatINR(placed.total)} has
          been sent to the artisans. They&apos;ll begin packing it by hand shortly.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard/customer" className={buttonClass.primary}>
            Track my order
          </Link>
          <Link href="/shop" className={buttonClass.outline}>
            Keep shopping
          </Link>
        </div>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <ShoppingBag className="size-12 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-6 text-4xl font-semibold">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">Discover handwoven Phanek, shawls and pottery from Manipur.</p>
        <Link href="/shop" className={`${buttonClass.primary} mt-8`}>
          Explore the shop
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-semibold md:text-5xl">Your cart</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {lines.map(({ item, product }) => (
            <li key={product.id} className="flex gap-4 py-5">
              <Link href={`/products/${product.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted md:size-28">
                <Image src={product.image || '/placeholder.svg'} alt={product.name} fill sizes="112px" className="object-cover" />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link href={`/products/${product.slug}`} className="font-medium hover:text-primary">
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">by {getArtisan(product.artisanId)?.name}</p>
                  </div>
                  <p className="font-semibold">{formatINR(product.price * item.quantity)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-full border border-input">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(product.id, item.quantity - 1)}
                      className="flex size-9 items-center justify-center"
                      aria-label={`Decrease quantity of ${product.name}`}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(product.id, Math.min(product.stock, item.quantity + 1))}
                      className="flex size-9 items-center justify-center"
                      aria-label={`Increase quantity of ${product.name}`}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(product.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                  >
                    <Trash2 className="size-3.5" /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={onCheckout} className="flex h-fit flex-col gap-4 rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-32">
          <h2 className="text-2xl font-semibold">Checkout</h2>
          <div className="grid gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Full name</span>
              <input name="name" required defaultValue={currentUser?.name} className={inputClass} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Phone</span>
              <input name="phone" required type="tel" className={inputClass} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Address</span>
              <input name="address" required placeholder="House no., street, area" className={inputClass} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium">City</span>
                <input name="city" required className={inputClass} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">PIN code</span>
                <input name="pin" required inputMode="numeric" pattern="[0-9]{6}" placeholder="560001" className={inputClass} />
              </label>
            </div>
          </div>

          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Orders are recorded in the marketplace. Online payment collection is not configured yet.</p>

          <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{shipping === 0 ? 'Free' : formatINR(shipping)}</dd>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-gold">Add {formatINR(FREE_SHIPPING - subtotal)} more for free shipping</p>
            )}
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatINR(total)}</dd>
            </div>
          </dl>
          {!currentUser && <p className="text-sm text-destructive">Sign in to save your cart and place an order. <Link className="underline" href="/auth/login?next=/cart">Sign in</Link></p>}
          <button type="submit" disabled={!currentUser || checkingOut} className={cn(buttonClass.primary, 'h-12')}>
            Place order · {formatINR(total)}
          </button>
          <p className="text-center text-xs text-muted-foreground">Demo checkout — no payment is charged.</p>
        </form>
      </div>
    </div>
  )
}
