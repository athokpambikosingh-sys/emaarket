import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, MapPin } from 'lucide-react'
import type { Artisan } from '@/lib/types'
import { Rating } from './shared'

export function ArtisanCard({ artisan, productCount }: { artisan: Artisan; productCount?: number }) {
  return (
    <Link
      href={`/artisans/${artisan.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={artisan.image || '/placeholder.svg'}
          alt={`Portrait of ${artisan.name}`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center gap-1.5">
          <h3 className="font-serif text-xl font-semibold leading-tight">{artisan.name}</h3>
          {artisan.verified && (
            <BadgeCheck className="size-4 shrink-0 text-gold" aria-label="Verified artisan" />
          )}
        </div>
        <p className="text-sm font-medium text-primary">{artisan.craft}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden="true" />
          {artisan.location}
        </p>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{artisan.bio}</p>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>{artisan.experienceYears} yrs experience</span>
          {productCount !== undefined && <span>{productCount} products</span>}
          <Rating value={artisan.rating} />
        </div>
      </div>
    </Link>
  )
}
