'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Calendar, Languages, Mail, MapPin, MessageCircle, Phone, Users } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { useStore } from '@/lib/store'
import { ProductCard } from '../product-card'
import { Badge, buttonClass, Rating } from '../shared'

export function ArtisanProfile({ artisanId }: { artisanId: string }) {
  const { getArtisan, artisans, products, startConversation, loading } = useStore()
  const router = useRouter()
  const artisan = getArtisan(artisanId) || artisans.find((item) => item.slug === artisanId)
  if (loading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-muted-foreground" role="status">Loading artisan profile…</div>
  if (!artisan) return null
  const listings = products.filter((p) => p.artisanId === artisan.id)

  async function chat() {
    if (!artisan) return
    const id = await startConversation(artisan.id)
    if (id) router.push(`/messages?c=${id}`)
  }

  return (
    <>
      <section className="bg-maroon-deep text-primary-foreground pattern-weave">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 md:grid-cols-[320px_1fr] md:px-6">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-t-[10rem] rounded-b-2xl border-4 border-gold/60">
            <Image
              src={artisan.image || '/placeholder.svg'}
              alt={`Portrait of ${artisan.name}`}
              fill
              priority
              sizes="320px"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{artisan.craft}</p>
            <h1 className="mt-2 flex flex-wrap items-center gap-3 text-5xl font-semibold md:text-6xl">
              {artisan.name}
              {artisan.verified && <BadgeCheck className="size-7 text-gold" aria-label="Verified artisan" />}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-primary-foreground/80">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden="true" /> {artisan.location}
              </span>
              <Rating value={artisan.rating} className="[&_span]:text-primary-foreground" />
              <span>{artisan.experienceYears} years of craft</span>
            </div>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-primary-foreground/85">{artisan.bio}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {artisan.specialization.map((s) => (
                <span key={s} className="rounded-full border border-primary-foreground/25 px-3 py-1 text-xs">
                  {s}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={chat} className={buttonClass.gold}>
                <MessageCircle className="size-4" /> Message {artisan.name.split(' ')[0]}
              </button>
              <Link
                href={`/bulk-orders?artisan=${artisan.id}`}
                className="inline-flex items-center justify-center rounded-full border border-primary-foreground/30 px-6 py-3 text-sm font-medium hover:border-gold hover:text-gold"
              >
                Request custom order
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:px-6 lg:grid-cols-[1fr_320px]">
        <article>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Her story</p>
          <h2 className="mt-2 text-4xl font-semibold">In her own words</h2>
          <p className="mt-4 whitespace-pre-line text-pretty text-lg leading-relaxed text-muted-foreground first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-6xl first-letter:leading-none first-letter:text-primary">
            {artisan.story}
          </p>
        </article>
        <aside className="h-fit rounded-2xl border border-border bg-card p-6">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Contact & details
          </h2>
          <ul className="mt-4 flex flex-col gap-4 text-sm">
            {artisan.phone && <li className="flex items-start gap-3">
              <Phone className="mt-0.5 size-4 text-gold" aria-hidden="true" />
              <a href={`tel:${artisan.phone.replace(/\s/g, '')}`} className="hover:text-primary">
                {artisan.phone}
              </a>
            </li>}
            {artisan.email && <li className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 text-gold" aria-hidden="true" />
              <a href={`mailto:${artisan.email}`} className="break-all hover:text-primary">
                {artisan.email}
              </a>
            </li>}
            <li className="flex items-start gap-3">
              <Languages className="mt-0.5 size-4 text-gold" aria-hidden="true" />
              {artisan.languages.join(', ')}
            </li>
            {artisan.cooperative && (
              <li className="flex items-start gap-3">
                <Users className="mt-0.5 size-4 text-gold" aria-hidden="true" />
                {artisan.cooperative}
              </li>
            )}
            <li className="flex items-start gap-3">
              <Calendar className="mt-0.5 size-4 text-gold" aria-hidden="true" />
              On Emaarket since {formatDate(artisan.joined)}
            </li>
          </ul>
          {artisan.verified && (
            <Badge tone="gold" className="mt-6">
              <BadgeCheck className="size-3.5" /> Verified in person
            </Badge>
          )}
        </aside>
      </div>

      <section className="mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="text-3xl font-semibold">
          From {artisan.name.split(' ')[0]}&apos;s workshop{' '}
          <span className="text-lg font-normal text-muted-foreground">({listings.length})</span>
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
          {listings.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  )
}
