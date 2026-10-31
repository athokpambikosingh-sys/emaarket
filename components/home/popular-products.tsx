'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { ProductCard } from '../product-card'
import { SectionHeading } from '../shared'

export function PopularProducts() {
  const { products } = useStore()
  const popular = [...products]
    .filter((p) => p.featured)
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 8)

  return (
    <section className="bg-secondary py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Most loved"
          title="Popular this season"
          action={
            <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              View all products
              <ArrowRight className="size-4" />
            </Link>
          }
        />
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
          {popular.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  )
}
