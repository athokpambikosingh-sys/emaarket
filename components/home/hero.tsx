import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { buttonClass } from '../shared'

const stats = [
  { value: '320+', label: 'Artisans onboarded' },
  { value: '78%', label: 'Women-led workshops' },
  { value: '92%', label: 'Of every sale to the maker' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-2 md:px-6 md:pb-24 md:pt-16">
        <div className="flex flex-col gap-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Handloom · Handicraft · Heritage
          </p>
          <h1 className="text-balance text-5xl font-semibold leading-[1.02] text-foreground md:text-7xl">
            Woven in Manipur, <span className="italic text-primary">straight from</span> the hands that
            made it.
          </h1>
          <p className="max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
            Discover Phanek, Innaphi, Longpi pottery and bamboo crafts sold directly by local artisans and
            women entrepreneurs — no middlemen, just fair prices and living traditions.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop" className={buttonClass.primary}>
              Shop the collection
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/artisans" className={buttonClass.outline}>
              Meet the artisans
            </Link>
          </div>
          <dl className="mt-4 grid max-w-lg grid-cols-3 gap-4 border-t border-border pt-6">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-serif text-3xl font-semibold text-primary md:text-4xl">{s.value}</dd>
                <dd className="mt-1 text-xs leading-snug text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-[12rem] rounded-b-2xl border-4 border-card shadow-xl md:aspect-[5/6]">
            <Image
              src="/images/hero.png"
              alt="A Manipuri artisan weaving a maroon and gold Phanek on a wooden handloom"
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 left-4 max-w-[15rem] rounded-xl border border-border bg-card p-4 shadow-lg md:-left-8">
            <p className="font-serif text-lg font-semibold leading-tight">Thoibi Devi</p>
            <p className="text-xs text-muted-foreground">Weaving Phanek in Wangkhei for 22 years</p>
            <Link href="/artisans/thoibi-devi-laishram" className="mt-2 inline-flex text-xs font-medium text-primary hover:underline">
              Read my story
            </Link>
          </div>
        </div>
      </div>
      <div className="pattern-band h-3" aria-hidden="true" />
    </section>
  )
}
