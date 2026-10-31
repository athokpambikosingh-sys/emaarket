import type { Metadata } from 'next'
import { ProductDetail } from '@/components/product/product-detail'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient()
    const { data } = await supabase.from('products').select('name, description').eq('slug', slug).maybeSingle()
    return { title: data?.name ?? 'Product', description: data?.description }
  }
  return { title: 'Product', description: 'Explore artisan products on Emaarket.' }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <ProductDetail slug={slug} />
}
