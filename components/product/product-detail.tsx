'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  BadgeCheck,
  ChevronRight,
  Heart,
  MessageCircle,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { categories } from '@/lib/data'
import { formatINR } from '@/lib/format'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ProductCard } from '../product-card'
import { ReviewForm } from './review-form'
import { ProductReviews } from './product-reviews'
import { Badge, buttonClass, Rating } from '../shared'

const tabs = ['Description', 'Materials & size', 'Care'] as const

export function ProductDetail({ slug }: { slug: string }) {
  const { products, getArtisan, addToCart, wishlist, toggleWishlist, startConversation, orders, currentUser, catalogLoading, catalogError, retry } = useStore()
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<(typeof tabs)[number]>('Description')

  const product = products.find((p) => p.slug === slug)

  if (catalogLoading) return <div className="mx-auto max-w-7xl px-4 py-24 text-center text-sm text-muted-foreground" role="status" aria-live="polite">Loading product…</div>
  if (catalogError) return <div className="mx-auto max-w-xl px-4 py-24 text-center text-sm text-destructive" role="alert">Could not load this product: {catalogError}<br /><button type="button" onClick={retry} className={`${buttonClass.primary} mt-6`}>Try again</button></div>

  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-4xl font-semibold">Product not found</h1>
        <p className="mt-3 text-muted-foreground">This piece may have sold out or been removed by the artisan.</p>
        <Link href="/shop" className={`${buttonClass.primary} mt-6`}>
          Back to shop
        </Link>
      </div>
    )
  }

  const artisan = getArtisan(product.artisanId)
  const category = categories.find((c) => c.id === product.category)
  const saved = wishlist.includes(product.id)
  const related = products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.artisanId === product.artisanId))
    .slice(0, 4)
  const purchased = Boolean(currentUser && orders.some((order) => order.status === 'Delivered' && order.items.some((item) => item.productId === product.id && item.orderItemId)))

  async function chat() {
    if (!product) return
    const id = await startConversation(product.artisanId, product.id)
    if (id) router.push(`/messages?c=${id}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/shop" className="hover:text-primary">
          Shop
        </Link>
        <ChevronRight className="size-3" aria-hidden="true" />
        <Link href={`/shop?category=${product.category}`} className="hover:text-primary">
          {category?.name}
        </Link>
        <ChevronRight className="size-3" aria-hidden="true" />
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
          <Image
            src={product.image || '/placeholder.svg'}
            alt={product.name}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap gap-2">
            {product.isDemo && <Badge tone="gold">Demo preview - not for sale</Badge>}
            {!product.isDemo && product.customizable && <Badge tone="gold">Customisable</Badge>}
            {!product.isDemo && product.bulkAvailable && <Badge>Bulk from {product.minBulkQty} pcs</Badge>}
            {!product.isDemo && <Badge tone="muted">Handmade in Manipur</Badge>}
          </div>
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight md:text-5xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-4">
            <Rating value={product.rating} reviews={product.reviews} />
            <span className="text-sm text-muted-foreground">
              {product.isDemo
                ? 'Fictional listing for presentation only'
                : product.stock > 0 ? `${product.stock} in stock` : 'Sold out — available to order'}
            </span>
          </div>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-serif text-4xl font-semibold text-primary">{formatINR(product.price)}</span>
            {product.originalPrice && (
              <span className="text-lg text-muted-foreground line-through">{formatINR(product.originalPrice)}</span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {product.isDemo ? 'Illustrative demo price only' : 'Inclusive of all taxes'}
          </p>

          <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>

          {product.isDemo ? (
            <p className="mt-8 rounded-lg bg-secondary p-4 text-sm">
              This fictional listing is for presentation only. Purchase, messaging, wishlist, and custom/bulk-order actions are disabled.
            </p>
          ) : <>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex h-12 items-center rounded-full border border-input bg-card">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex size-12 items-center justify-center"
                aria-label="Decrease quantity"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center font-medium" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(product.stock || 1, q + 1))}
                className="flex size-12 items-center justify-center"
                aria-label="Increase quantity"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <button
              type="button"
              disabled={product.stock === 0}
              onClick={() => addToCart(product.id, qty)}
              className={cn(buttonClass.primary, 'h-12 flex-1')}
            >
              Add to cart
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-pressed={saved}
              aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
              className="flex size-12 items-center justify-center rounded-full border border-input bg-card hover:border-primary"
            >
              <Heart className={cn('size-5', saved && 'fill-primary text-primary')} />
            </button>
          </div>
          <button
            type="button"
            disabled={product.stock === 0}
            onClick={() => {
              addToCart(product.id, qty)
              router.push('/cart')
            }}
            className={cn(buttonClass.gold, 'mt-3 h-12 w-full')}
          >
            Buy now
          </button>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={chat}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-primary"
            >
              <MessageCircle className="size-5 shrink-0 text-primary" />
              <span>
                <span className="block text-sm font-medium">Chat with artisan</span>
                <span className="block text-xs text-muted-foreground">Ask questions or negotiate</span>
              </span>
            </button>
            <Link
              href={`/bulk-orders?product=${product.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary"
            >
              <Package className="size-5 shrink-0 text-primary" />
              <span>
                <span className="block text-sm font-medium">Custom / bulk order</span>
                <span className="block text-xs text-muted-foreground">Get a quote in 48 hrs</span>
              </span>
            </Link>
          </div>
          </>}

          {!product.isDemo && <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Truck className="size-4 text-gold" aria-hidden="true" /> Ships in 3–5 days from Manipur
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-gold" aria-hidden="true" /> Authenticity certified by the artisan
            </li>
          </ul>}

          <div className="mt-8 border-t border-border pt-6">
            <div role="tablist" aria-label="Product information" className="flex gap-6 border-b border-border">
              {tabs.map((t) => (
                <button
                  key={t}
                  role="tab"
                  type="button"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn(
                    '-mb-px border-b-2 pb-3 text-sm font-medium',
                    tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div role="tabpanel" className="pt-4 text-sm leading-relaxed text-muted-foreground">
              {tab === 'Description' && <p>{product.description}</p>}
              {tab === 'Materials & size' && (
                <dl className="grid grid-cols-[120px_1fr] gap-y-2">
                  <dt className="font-medium text-foreground">Material</dt>
                  <dd>{product.material}</dd>
                  <dt className="font-medium text-foreground">Dimensions</dt>
                  <dd>{product.dimensions}</dd>
                  <dt className="font-medium text-foreground">Craft</dt>
                  <dd>{category?.name}</dd>
                </dl>
              )}
              {tab === 'Care' && <p>{product.care}</p>}
            </div>
          </div>
        </div>
      </div>

      {artisan && (
        <section className="mt-16 grid items-center gap-6 rounded-2xl bg-secondary p-6 pattern-weave md:grid-cols-[auto_1fr_auto] md:p-8">
          <div className="relative size-24 overflow-hidden rounded-full border-4 border-card">
            <Image src={artisan.image || '/placeholder.svg'} alt={`Portrait of ${artisan.name}`} fill sizes="96px" className="object-cover" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{artisan.isDemo ? 'Fictional demo artisan' : 'Made by'}</p>
            <h2 className="mt-1 flex items-center gap-2 text-3xl font-semibold">
              {artisan.name}
              {artisan.verified && <BadgeCheck className="size-5 text-gold" aria-label="Verified artisan" />}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {artisan.craft} · {artisan.location} · {artisan.experienceYears} years
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{artisan.bio}</p>
          </div>
          <Link href={`/artisans/${artisan.slug}`} className={buttonClass.outline}>
            View profile
          </Link>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-3xl font-semibold">You may also love</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      <section className="mt-16 border-t border-border pt-10">
        <h2 className="text-3xl font-semibold">Reviews</h2>
        <p className="mt-2 text-sm text-muted-foreground">{product.reviews ? `${product.rating.toFixed(1)} out of 5 · ${product.reviews} reviews` : 'No reviews yet.'}</p>
        <ProductReviews productId={product.id} />
        {!product.isDemo && (purchased ? <ReviewForm productId={product.id} /> : <p className="mt-4 text-sm text-muted-foreground">Verified buyers can leave a review after this order is delivered.</p>)}
      </section>
    </div>
  )
}
