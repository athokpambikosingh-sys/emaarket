import type { Metadata } from 'next'
import { WishlistView } from '@/components/wishlist-view'
import { PageHeader } from '@/components/shared'

export const metadata: Metadata = { title: 'Wishlist' }

export default function WishlistPage() {
  return (
    <>
      <PageHeader eyebrow="Saved for later" title="Your wishlist" />
      <WishlistView />
    </>
  )
}
