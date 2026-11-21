'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle2, Gift, Store, Users } from 'lucide-react'
import { categories } from '@/lib/data'
import { formatINR } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { BulkRequest, CategoryId } from '@/lib/types'
import { cn } from '@/lib/utils'
import { buttonClass, inputClass } from '../shared'

const useCases = [
  { icon: Users, title: 'Weddings & ceremonies', text: 'Matching Phanek and Innaphi sets for the whole family.' },
  { icon: Gift, title: 'Corporate gifting', text: 'Shawls and pottery with your logo, packed in handmade boxes.' },
  { icon: Store, title: 'Boutiques & retail', text: 'Wholesale pricing and private labels for your store.' },
]

export function BulkOrderForm({ productId, artisanId }: { productId?: string; artisanId?: string }) {
  const { getProduct, artisans, submitBulkRequest, currentUser, catalogLoading } = useStore()
  const product = productId ? getProduct(productId) : undefined
  const requestedArtisan = artisanId ? artisans.find((artisan) => artisan.id === artisanId) : undefined
  const [submitted, setSubmitted] = useState<BulkRequest | null>(null)

  const demoTarget = Boolean(product?.isDemo || requestedArtisan?.isDemo)
  const missingTarget = Boolean((productId && !product) || (artisanId && !requestedArtisan))
  const availableArtisans = artisans.filter((artisan) => !artisan.isDemo)
  const defaultArtisan = product?.artisanId ?? (availableArtisans.some((a) => a.id === artisanId) ? artisanId : '')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (demoTarget) return
    const f = new FormData(e.currentTarget)
    const created = await submitBulkRequest({
      name: String(f.get('name')),
      business: String(f.get('business') || 'Individual'),
      email: String(f.get('email')),
      phone: String(f.get('phone')),
      category: String(f.get('category')) as CategoryId,
      quantity: Number(f.get('quantity')),
      budget: Number(f.get('budget')),
      deadline: String(f.get('deadline')),
      customization: String(f.get('customization')),
      artisanId: String(f.get('artisan')) || undefined,
      productId: product?.id,
    })
    if (created) setSubmitted(created)
  }

  if (catalogLoading) {
    return <div className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-muted-foreground" role="status">Loading catalog…</div>
  }

  if (missingTarget) {
    return <div className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-muted-foreground" role="alert">This product or artisan is unavailable. Return to the catalog and try again.</div>
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <CheckCircle2 className="size-14 text-gold" aria-hidden="true" />
        <h2 className="mt-6 text-4xl font-semibold">Request {submitted.id} received</h2>
        <p className="mt-3 text-muted-foreground">
          We&apos;ve shared your request for {submitted.quantity} pieces (budget {formatINR(submitted.budget)}) with
          matching artisans. Expect quotes in your messages and at {submitted.email}.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/messages" className={buttonClass.primary}>
            Go to messages
          </Link>
          <button type="button" onClick={() => setSubmitted(null)} className={buttonClass.outline}>
            Submit another
          </button>
        </div>
      </div>
    )
  }

  if (demoTarget) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center" role="status">
        <h2 className="font-serif text-3xl font-semibold">Demo preview - not for sale</h2>
        <p className="mt-3 text-muted-foreground">Fictional demo listings and artisans cannot receive custom or bulk-order requests.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 md:px-6 lg:grid-cols-[1fr_380px]">
      <form onSubmit={onSubmit} className="grid gap-6 rounded-2xl border border-border bg-card p-6 md:p-8">
        {product && (
          <p className="rounded-lg bg-secondary px-4 py-3 text-sm">
            Requesting a custom version of <span className="font-medium">{product.name}</span>
          </p>
        )}
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 font-serif text-2xl font-semibold">Your details</legend>
          <Field label="Full name">
            <input name="name" required defaultValue={currentUser?.name} className={inputClass} />
          </Field>
          <Field label="Business / organisation" hint="Optional">
            <input name="business" placeholder="e.g. Loom & Leaf Boutique" className={inputClass} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" required defaultValue={currentUser?.email} className={inputClass} />
          </Field>
          <Field label="Phone">
            <input name="phone" type="tel" required placeholder="+91 98765 43210" className={inputClass} />
          </Field>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 font-serif text-2xl font-semibold">What you need</legend>
          <Field label="Product category">
            <select name="category" required defaultValue={product?.category ?? 'phanek'} className={inputClass}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preferred artisan" hint="Optional">
            <select name="artisan" defaultValue={defaultArtisan} className={inputClass}>
              <option value="">Match me with the best fit</option>
              {availableArtisans.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.craft}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantity (pieces)">
            <input
              name="quantity"
              type="number"
              required
              min={product?.minBulkQty ?? 5}
              defaultValue={product?.minBulkQty ?? 20}
              className={inputClass}
            />
          </Field>
          <Field label="Total budget (₹)">
            <input
              name="budget"
              type="number"
              required
              min={1000}
              step={500}
              defaultValue={product ? product.price * (product.minBulkQty ?? 20) : 50000}
              className={inputClass}
            />
          </Field>
          <Field label="Needed by" className="sm:col-span-2">
            <input name="deadline" type="date" required min="2026-11-07" className={inputClass} />
          </Field>
          <Field label="Customisation details" className="sm:col-span-2">
            <textarea
              name="customization"
              required
              rows={5}
              placeholder="Colours, motifs, sizes, labels or packaging you have in mind…"
              className={cn(inputClass, 'h-auto py-3')}
            />
          </Field>
        </fieldset>

        {!currentUser && <p className="text-sm text-destructive">Sign in to submit and track your request. <Link href="/auth/login?next=/bulk-orders" className="underline">Sign in</Link></p>}
        <button type="submit" disabled={!currentUser} className={cn(buttonClass.primary, 'h-12 sm:justify-self-start')}>
          Submit request
        </button>
      </form>

      <aside className="flex flex-col gap-6">
        <div className="rounded-2xl bg-maroon-deep p-6 text-primary-foreground pattern-weave">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <ol className="mt-4 flex flex-col gap-3 text-sm text-primary-foreground/85">
            <li>1. Submit your request with quantity, budget and timeline.</li>
            <li>2. Artisans reply with quotes and sample photos.</li>
            <li>3. Negotiate directly in chat and confirm the order.</li>
            <li>4. Pay 30% advance; balance on dispatch.</li>
          </ol>
        </div>
        {useCases.map((u) => (
          <div key={u.title} className="flex gap-4">
            <u.icon className="size-6 shrink-0 text-gold" aria-hidden="true" />
            <div>
              <h3 className="font-sans text-sm font-semibold">{u.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{u.text}</p>
            </div>
          </div>
        ))}
      </aside>
    </div>
  )
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn('text-sm', className)}>
      <span className="mb-1.5 flex justify-between font-medium">
        {label}
        {hint && <span className="font-normal text-muted-foreground">{hint}</span>}
      </span>
      {children}
    </label>
  )
}
