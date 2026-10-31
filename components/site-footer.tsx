import Link from 'next/link'
import { categories } from '@/lib/data'

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-maroon-deep text-primary-foreground">
      <div className="pattern-band h-3 rotate-180" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4 md:px-6">
        <div className="md:col-span-1">
          <p className="font-serif text-3xl font-semibold">Emaarket</p>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/70">
            Inspired by Ima Keithel — Imphal&apos;s centuries-old market run entirely by women. We connect
            Manipuri artisans directly with buyers across India and the world.
          </p>
        </div>
        <FooterCol
          title="Shop"
          links={categories.map((c) => ({ href: `/shop?category=${c.id}`, label: c.name }))}
        />
        <FooterCol
          title="Discover"
          links={[
            { href: '/artisans', label: 'Meet the artisans' },
            { href: '/bulk-orders', label: 'Bulk & custom orders' },
            { href: '/messages', label: 'Chat with artisans' },
          ]}
        />
        <FooterCol
          title="Account"
          links={[
            { href: '/dashboard/customer', label: 'My orders' },
            { href: '/wishlist', label: 'Wishlist' },
            { href: '/dashboard/artisan', label: 'Sell on Emaarket' },
          ]}
        />
      </div>
      <div className="border-t border-primary-foreground/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-primary-foreground/60 md:px-6">
          © 2026 Emaarket. Handmade with pride in Manipur.
        </p>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-gold">{title}</h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-primary-foreground/80 hover:text-primary-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
