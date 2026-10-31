import type { Metadata } from 'next'
import { ArtisanDirectory } from '@/components/artisans/artisan-directory'
import { PageHeader } from '@/components/shared'

export const metadata: Metadata = {
  title: 'Meet the Artisans',
  description: 'Weavers, potters and bamboo craftspeople from across Manipur selling directly on Emaarket.',
}

export default function ArtisansPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our makers"
        title="Meet the artisans"
        description="Every artisan on Emaarket is verified in person by our field team in Manipur. Most are women running their own looms, studios or cooperatives."
      />
      <ArtisanDirectory />
    </>
  )
}
