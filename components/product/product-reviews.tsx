'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/format'

type ReviewRow = { id: string; rating: number; title: string; body: string; created_at: string }

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return
    const supabase = createClient()
    let alive = true
    const load = async () => {
      const { data } = await supabase.from('reviews').select('id, rating, title, body, created_at').eq('product_id', productId).eq('is_published', true).order('created_at', { ascending: false })
      if (alive) setReviews(data || [])
    }
    void load()
    const channel = supabase.channel(`product-reviews-${productId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `product_id=eq.${productId}` }, () => void load()).subscribe()
    return () => { alive = false; void channel.unsubscribe() }
  }, [productId])
  if (!reviews.length) return null
  return <ul className="mt-6 grid max-w-3xl gap-3">{reviews.map((review) => <li key={review.id} className="rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between gap-4"><p className="font-medium">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p><time className="text-xs text-muted-foreground">{formatDate(review.created_at)}</time></div>{review.title && <h3 className="mt-2 font-medium">{review.title}</h3>}{review.body && <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{review.body}</p>}</li>)}</ul>
}
