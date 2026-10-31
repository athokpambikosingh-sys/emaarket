'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useStore } from '@/lib/store'
import { ProductCard } from './product-card'
import { buttonClass } from './shared'

export function WishlistView() {
  const { wishlist, products, loading } = useStore()
  const saved = products.filter((p) => wishlist.includes(p.id))

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-muted-foreground" role="status" aria-live="polite">Loading your wishlist…</div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      {saved.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Heart className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 font-serif text-2xl font-semibold">No saved pieces yet</p>
          <p className="mt-2 text-sm text-muted-foreground">Tap the heart on any product to keep it here.</p>
          <Link href="/shop" className={`${buttonClass.primary} mt-6`}>
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
          {saved.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
