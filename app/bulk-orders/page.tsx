import type { Metadata } from 'next'
import { BulkOrderForm } from '@/components/bulk/bulk-order-form'
import { PageHeader } from '@/components/shared'

export const metadata: Metadata = {
  title: 'Custom & Bulk Orders',
  description: 'Request custom or bulk orders of Manipuri handloom and handicrafts for weddings, corporate gifting and retail.',
}

export default async function BulkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; artisan?: string }>
}) {
  const { product, artisan } = await searchParams
  return (
    <>
      <PageHeader
        eyebrow="For boutiques, events & gifting"
        title="Custom & bulk orders"
        description="Tell us what you need. Matching artisans will review your request and reply with a quote — usually within 48 hours."
      />
      <BulkOrderForm key={`${product}-${artisan}`} productId={product} artisanId={artisan} />
    </>
  )
}
