'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, Plus } from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatINR } from '@/lib/format'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Rating } from './shared'

export function ProductCard({ product }: { product: Product }) {
  const { getArtisan, wishlist, toggleWishlist, addToCart } = useStore()
  const artisan = getArtisan(product.artisanId)
  const saved = wishlist.includes(product.id)
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
        <Link href={`/products/${product.slug}`} aria-label={product.name}>
          <Image
            src={product.image || '/placeholder.svg'}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              {discount}% off
            </span>
          )}
          {product.stock > 0 && product.stock <= 7 && (
            <span className="rounded-full bg-card px-2.5 py-0.5 text-xs font-medium text-foreground">
              Only {product.stock} left
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm transition-colors hover:text-primary"
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
        >
          <Heart className={cn('size-4', saved && 'fill-primary text-primary')} />
        </button>
        <button
          type="button"
          onClick={() => addToCart(product.id)}
          disabled={product.stock === 0}
          className="absolute bottom-3 right-3 flex size-10 translate-y-2 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-md transition-all group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 disabled:hidden"
          aria-label={`Add ${product.name} to cart`}
        >
          <Plus className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">
          by{' '}
          {artisan ? (
            <Link href={`/artisans/${artisan.slug}`} className="hover:text-primary">
              {artisan.name}
            </Link>
          ) : (
            'Local artisan'
          )}
        </p>
        <h3 className="font-sans text-sm font-medium leading-snug text-foreground">
          <Link href={`/products/${product.slug}`} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold">{formatINR(product.price)}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatINR(product.originalPrice)}
              </span>
            )}
          </div>
          <Rating value={product.rating} />
        </div>
      </div>
    </article>
  )
}
