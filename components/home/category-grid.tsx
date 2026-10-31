import Image from 'next/image'
import Link from 'next/link'
import { categories } from '@/lib/data'
import { SectionHeading } from '../shared'

export function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
      <SectionHeading
        eyebrow="Featured collections"
        title="Six crafts, one living heritage"
        description="Each collection is made by a different community across Manipur — from the valley looms of Imphal to the stone potters of Ukhrul."
      />
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
        {categories.map((c, i) => (
          <Link
            key={c.id}
            href={`/shop?category=${c.id}`}
            className={`group relative overflow-hidden rounded-xl bg-muted ${i === 0 ? 'md:row-span-2' : ''}`}
          >
            <div className={`relative ${i === 0 ? 'aspect-square md:aspect-auto md:h-full' : 'aspect-square'}`}>
              <Image
                src={c.image || '/placeholder.svg'}
                alt=""
                fill
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-maroon-deep/85 via-maroon-deep/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                <h3 className="text-2xl font-semibold text-primary-foreground md:text-3xl">{c.name}</h3>
                <p className="mt-1 hidden text-sm text-primary-foreground/80 md:block">{c.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
