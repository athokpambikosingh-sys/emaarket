import type { Metadata } from 'next'
import { ArtisanProfile } from '@/components/artisans/artisan-profile'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  await params
  return { title: 'Artisan', description: 'Meet the artisan and explore their work on Emaarket.' }
}

export default async function ArtisanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <ArtisanProfile artisanId={slug} />
}
