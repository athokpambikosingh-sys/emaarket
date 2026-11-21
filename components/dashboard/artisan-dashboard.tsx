'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { BadgeCheck, ExternalLink } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ChatInbox } from '../chat/chat-inbox'
import { ArtisanOverview } from './artisan-overview'
import { ArtisanProducts } from './artisan-products'
import { ArtisanOrders } from './artisan-orders'
import { ArtisanBulk } from './artisan-bulk'

const tabs = ['Overview', 'Products', 'Orders', 'Messages', 'Bulk requests'] as const
type Tab = (typeof tabs)[number]

export function ArtisanDashboard() {
  const { getArtisan, conversations, bulkRequests, currentArtisanId, uploadArtisanImage, loading, catalogError, retry } = useStore()
  const [tab, setTab] = useState<Tab>('Overview')
  const artisan = currentArtisanId ? getArtisan(currentArtisanId) : undefined
  if (loading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-muted-foreground" role="status" aria-live="polite">Loading your artisan dashboard…</div>
  if (catalogError) return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-destructive" role="alert">Could not load your dashboard: {catalogError}<br /><button type="button" onClick={retry} className="mt-3 underline">Try again</button></div>
  if (!artisan) return null

  const inbox = conversations.filter((c) => c.artisanId === artisan.id)
  const openBulk = bulkRequests.filter(
    (b) => (b.artisanId === artisan.id || !b.artisanId) && b.status === 'Submitted',
  ).length

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="relative size-16 overflow-hidden rounded-full border-2 border-gold">
            <Image src={artisan.image || '/placeholder.svg'} alt="" fill sizes="64px" className="object-cover" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Artisan dashboard</p>
            <h1 className="flex items-center gap-2 text-3xl font-semibold md:text-4xl">
              {artisan.name}
              {artisan.verified && <BadgeCheck className="size-5 text-gold" aria-label="Verified" />}
            </h1>
          </div>
        </div>
        <Link
          href={`/artisans/${artisan.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          View public profile <ExternalLink className="size-4" />
        </Link>
      </div>
      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline">
        Update profile photo
        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadArtisanImage(file) }} />
      </label>

      <div role="tablist" aria-label="Dashboard sections" className="mt-8 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => {
          const count = t === 'Messages' ? inbox.filter((c) => c.unread).length : t === 'Bulk requests' ? openBulk : 0
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 pb-3 pt-2 text-sm font-medium',
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t}
              {count > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" className="pt-8">
        {tab === 'Overview' && <ArtisanOverview artisanId={artisan.id} onNavigate={setTab} />}
        {tab === 'Products' && <ArtisanProducts artisanId={artisan.id} />}
        {tab === 'Orders' && <ArtisanOrders artisanId={artisan.id} />}
        {tab === 'Messages' && <ChatInbox conversations={inbox} viewer="artisan" className="h-[65vh] min-h-[480px]" />}
        {tab === 'Bulk requests' && <ArtisanBulk artisanId={artisan.id} />}
      </div>
    </div>
  )
}
