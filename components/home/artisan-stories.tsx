'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { useStore } from '@/lib/store'
import { buttonClass } from '../shared'

export function ArtisanStories() {
  const { artisans } = useStore()
  const [featured, ...rest] = artisans
  if (!featured) return null

  return (
    <section className="bg-maroon-deep py-24 text-primary-foreground pattern-weave">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Artisan stories</p>
            <h2 className="mt-2 text-balance text-4xl font-semibold md:text-5xl">The hands behind every piece</h2>
          </div>
          <Link href="/artisans" className="inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:underline">
            All artisans <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          <article className="grid overflow-hidden rounded-2xl bg-primary-foreground/5 ring-1 ring-primary-foreground/10 md:grid-cols-2 lg:col-span-3">
            <div className="relative aspect-square md:aspect-auto">
              <Image
                src={featured.image || '/placeholder.svg'}
                alt={`Portrait of ${featured.name}`}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-4 p-6 md:p-8">
              <p className="flex items-center gap-1 text-xs text-primary-foreground/70">
                <MapPin className="size-3.5" aria-hidden="true" /> {featured.location}
              </p>
              <h3 className="text-3xl font-semibold">{featured.name}</h3>
              <p className="text-sm leading-relaxed text-primary-foreground/80">{featured.story}</p>
              <Link href={`/artisans/${featured.slug}`} className={`${buttonClass.gold} mt-auto self-start`}>
                Visit her studio
              </Link>
            </div>
          </article>

          <ul className="flex flex-col gap-4 lg:col-span-2">
            {rest.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/artisans/${a.slug}`}
                  className="flex items-center gap-4 rounded-xl p-3 ring-1 ring-primary-foreground/10 transition-colors hover:bg-primary-foreground/5"
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
                    <Image src={a.image || '/placeholder.svg'} alt="" fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-xl font-semibold">{a.name}</p>
                    <p className="text-sm text-gold">{a.craft}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-primary-foreground/70">{a.bio}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
