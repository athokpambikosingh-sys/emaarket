'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Heart, Menu, MessageCircle, Search, ShoppingBag, User, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/auth/actions'

const nav = [
  { href: '/shop', label: 'Shop' },
  { href: '/artisans', label: 'Artisans' },
  { href: '/bulk-orders', label: 'Bulk & Custom' },
  { href: '/messages', label: 'Messages' },
]

export function SiteHeader() {
  const { cart, wishlist, conversations, currentUser, currentArtisanId } = useStore()
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)
  const unread = conversations.filter((conversation) => conversation.unread && (currentUser?.role === 'artisan' ? conversation.artisanId === currentArtisanId : true)).length

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop')
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="pattern-band pb-3 pt-1.5 text-center text-xs tracking-wide text-primary-foreground">
        Free shipping across India on orders above ₹2,500 · Every purchase goes directly to the artisan
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
        <button
          type="button"
          className="rounded-md p-2 text-foreground md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link href="/" className="flex flex-col leading-none" aria-label="Emaarket home">
          <span className="font-serif text-2xl font-semibold tracking-tight text-primary md:text-3xl">
            Emaarket
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:block">
            Crafted in Manipur
          </span>
        </Link>

        <nav aria-label="Main" className="ml-6 hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname.startsWith(item.href) ? 'text-primary' : 'text-foreground/80',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={onSearch} role="search" className="ml-auto hidden max-w-xs flex-1 lg:block">
          <label htmlFor="site-search" className="sr-only">
            Search handicrafts
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="site-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Phanek, pottery, shawls…"
              className="h-10 w-full rounded-full border border-input bg-card pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          <Link
            href="/messages"
            className="relative rounded-full p-2 text-foreground hover:bg-muted md:hidden"
            aria-label="Messages"
          >
            <MessageCircle className="size-5" />
            {unread > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-gold" />}
          </Link>
          <Link
            href="/wishlist"
            className="relative rounded-full p-2 text-foreground hover:bg-muted"
            aria-label={`Wishlist, ${wishlist.length} items`}
          >
            <Heart className="size-5" />
            {wishlist.length > 0 && <CountBadge value={wishlist.length} />}
          </Link>
          <Link
            href="/cart"
            className="relative rounded-full p-2 text-foreground hover:bg-muted"
            aria-label={`Cart, ${cartCount} items`}
          >
            <ShoppingBag className="size-5" />
            {cartCount > 0 && <CountBadge value={cartCount} />}
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              className="rounded-full p-2 text-foreground hover:bg-muted"
              aria-label="Account menu"
              aria-expanded={accountOpen}
              aria-haspopup="menu"
            >
              <User className="size-5" />
            </button>
            {accountOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
                onClick={() => setAccountOpen(false)}
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-medium">{currentUser?.name || 'Your Emaarket account'}</p>
                  <p className="text-xs text-muted-foreground">{currentUser?.email || 'Sign in to view your orders and messages'}</p>
                </div>
                {currentUser ? <>
                  <Link role="menuitem" href={currentUser.role === 'admin' ? '/dashboard/admin' : currentUser.role === 'artisan' ? '/dashboard/artisan' : '/dashboard/customer'} className="block px-4 py-2.5 text-sm hover:bg-muted">
                    {currentUser.role === 'artisan' ? 'Artisan dashboard' : currentUser.role === 'admin' ? 'Admin dashboard' : 'My orders & wishlist'}
                  </Link>
                  <Link role="menuitem" href="/messages" className="block px-4 py-2.5 text-sm hover:bg-muted">
                    Messages {unread > 0 && <span className="text-gold">({unread} new)</span>}
                  </Link>
                  <form action={signOut}>
                  <button type="submit" role="menuitem" className="block w-full border-t border-border px-4 py-2.5 text-left text-sm hover:bg-muted">
                    Sign out
                  </button>
                  </form>
                </> : <>
                  <Link role="menuitem" href="/auth/login" className="block px-4 py-2.5 text-sm hover:bg-muted">Sign in</Link>
                  <Link role="menuitem" href="/auth/signup" className="block px-4 py-2.5 text-sm hover:bg-muted">Create account</Link>
                </>}
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          <form onSubmit={onSearch} role="search" className="pt-4">
            <label htmlFor="mobile-search" className="sr-only">
              Search handicrafts
            </label>
            <input
              id="mobile-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Phanek, pottery, shawls…"
              className="h-10 w-full rounded-full border border-input bg-card px-4 text-sm outline-none focus:border-gold"
            />
          </form>
          <nav aria-label="Mobile" className="mt-3 flex flex-col">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="border-b border-border py-3 text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/dashboard/artisan"
              onClick={() => setMobileOpen(false)}
              className="py-3 text-sm font-medium text-primary"
            >
              Artisan dashboard
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

function CountBadge({ value }: { value: number }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
      {value}
    </span>
  )
}
