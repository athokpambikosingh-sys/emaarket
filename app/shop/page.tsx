import type { Metadata } from 'next'
import { ShopView } from '@/components/shop/shop-view'
import { PageHeader } from '@/components/shared'
import type { CategoryId } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Shop Manipuri Handicrafts',
  description: 'Browse authentic Phanek, Innaphi, shawls, bamboo crafts, Longpi pottery and accessories.',
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { q = '', category = '' } = await searchParams
  return (
    <>
      <PageHeader
        eyebrow="Marketplace"
        title="Shop the collection"
        description="Every piece is listed by the artisan who made it. Filter by craft, price or maker to find something that speaks to you."
      />
      <ShopView key={`${q}-${category}`} initialQuery={q} initialCategory={(category as CategoryId) || 'all'} />
    </>
  )
}
