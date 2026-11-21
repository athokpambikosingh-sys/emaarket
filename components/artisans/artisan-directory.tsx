'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ArtisanCard } from '../artisan-card'
import { inputClass } from '../shared'

export function ArtisanDirectory() {
  const { artisans, products, catalogLoading, catalogError, retry } = useStore()
  const [query, setQuery] = useState('')
  const [district, setDistrict] = useState('All')
  const districts = ['All', ...Array.from(new Set(artisans.map((a) => a.district)))]

  const q = query.trim().toLowerCase()
  const list = artisans.filter(
    (a) =>
      (district === 'All' || a.district === district) &&
      (!q || [a.name, a.craft, a.location, ...a.specialization].join(' ').toLowerCase().includes(q)),
  )

  if (catalogLoading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-muted-foreground" role="status" aria-live="polite">Loading artisans…</div>
  if (catalogError) return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-destructive" role="alert">Could not load artisans: {catalogError}<br /><button type="button" onClick={retry} className="mt-3 underline">Try again</button></div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-96">
          <label htmlFor="artisan-search" className="sr-only">
            Search artisans
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="artisan-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, craft or village"
            className={cn(inputClass, 'pl-9')}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by district">
          {districts.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDistrict(d)}
              aria-pressed={district === d}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm',
                district === d ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:border-primary',
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((a) => (
          <ArtisanCard key={a.id} artisan={a} productCount={products.filter((p) => p.artisanId === a.id).length} />
        ))}
      </div>
      {list.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">No artisans match your search.</p>
      )}
    </div>
  )
}
