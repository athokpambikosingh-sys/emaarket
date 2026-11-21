'use client'

import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { categories } from '@/lib/data'
import { formatINR } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { CategoryId } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ProductCard } from '../product-card'
import { inputClass } from '../shared'

type Sort = 'popular' | 'price-asc' | 'price-desc' | 'rating'
const PRICE_CEILING = 5000

export function ShopView({
  initialQuery,
  initialCategory,
}: {
  initialQuery: string
  initialCategory: CategoryId | 'all'
}) {
  const { products, artisans, catalogLoading, catalogError, retry } = useStore()
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState<CategoryId | 'all'>(
    categories.some((c) => c.id === initialCategory) ? initialCategory : 'all',
  )
  const [maxPrice, setMaxPrice] = useState(PRICE_CEILING)
  const [artisanId, setArtisanId] = useState('all')
  const [customOnly, setCustomOnly] = useState(false)
  const [bulkOnly, setBulkOnly] = useState(false)
  const [inStock, setInStock] = useState(false)
  const [sort, setSort] = useState<Sort>('popular')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = products.filter((p) => {
      const artisan = artisans.find((a) => a.id === p.artisanId)
      const categoryName = categories.find((c) => c.id === p.category)?.name ?? ''
      if (
        q &&
        ![p.name, p.description, p.material, categoryName, artisan?.name ?? '', artisan?.district ?? '']
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
        return false
      if (category !== 'all' && p.category !== category) return false
      if (p.price > maxPrice) return false
      if (artisanId !== 'all' && p.artisanId !== artisanId) return false
      if (customOnly && !p.customizable) return false
      if (bulkOnly && !p.bulkAvailable) return false
      if (inStock && p.stock === 0) return false
      return true
    })
    return list.sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'rating') return b.rating - a.rating
      return b.reviews - a.reviews
    })
  }, [products, artisans, query, category, maxPrice, artisanId, customOnly, bulkOnly, inStock, sort])

  const activeFilters =
    (category !== 'all' ? 1 : 0) +
    (maxPrice < PRICE_CEILING ? 1 : 0) +
    (artisanId !== 'all' ? 1 : 0) +
    Number(customOnly) +
    Number(bulkOnly) +
    Number(inStock)

  if (catalogLoading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-muted-foreground" role="status" aria-live="polite">Loading products…</div>

  function reset() {
    setQuery('')
    setCategory('all')
    setMaxPrice(PRICE_CEILING)
    setArtisanId('all')
    setCustomOnly(false)
    setBulkOnly(false)
    setInStock(false)
  }

  const filterPanel = (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Category</legend>
        <div className="mt-3 flex flex-col gap-1">
          {[{ id: 'all' as const, name: 'All crafts' }, ...categories].map((c) => {
            const count =
              c.id === 'all' ? products.length : products.filter((p) => p.category === c.id).length
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={category === c.id}
                className={cn(
                  'flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors',
                  category === c.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
              >
                {c.name}
                <span className={cn('text-xs', category === c.id ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="max-price" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Max price
        </label>
        <input
          id="max-price"
          type="range"
          min={500}
          max={PRICE_CEILING}
          step={100}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="mt-4 w-full accent-primary"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{formatINR(500)}</span>
          <span className="font-medium text-foreground">
            {maxPrice >= PRICE_CEILING ? 'Any' : formatINR(maxPrice)}
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="artisan-filter" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Artisan
        </label>
        <select
          id="artisan-filter"
          value={artisanId}
          onChange={(e) => setArtisanId(e.target.value)}
          className={cn(inputClass, 'mt-3')}
        >
          <option value="all">All artisans</option>
          {artisans.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Availability</legend>
        <Check label="Customisable" checked={customOnly} onChange={setCustomOnly} />
        <Check label="Bulk orders available" checked={bulkOnly} onChange={setBulkOnly} />
        <Check label="In stock only" checked={inStock} onChange={setInStock} />
      </fieldset>

      {activeFilters > 0 && (
        <button type="button" onClick={reset} className="self-start text-sm font-medium text-primary hover:underline">
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-6 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block" aria-label="Filters">
        {filterPanel}
      </aside>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="shop-search" className="sr-only">
              Search products
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="shop-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, material, artisan or district"
              className={cn(inputClass, 'pl-9')}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex h-11 items-center gap-2 rounded-md border border-input bg-card px-4 text-sm lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
              Filters {activeFilters > 0 && `(${activeFilters})`}
            </button>
            <label htmlFor="sort" className="sr-only">
              Sort by
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className={cn(inputClass, 'w-auto')}
            >
              <option value="popular">Most popular</option>
              <option value="rating">Top rated</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>
        </div>

        <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
          {results.length} {results.length === 1 ? 'piece' : 'pieces'}
          {query && (
            <>
              {' '}
              for <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>
            </>
          )}
        </p>
        {catalogError && <div role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><p>{catalogError}</p><button type="button" onClick={retry} className="mt-2 font-medium underline">Try again</button></div>}

        {results.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="font-serif text-2xl font-semibold">{products.length === 0 && !query && activeFilters === 0 ? 'No products listed yet' : 'Nothing matches just yet'}</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {products.length === 0 && !query && activeFilters === 0 ? 'New artisan listings will appear here when they are published.' : 'Try a different search, or ask an artisan to make it for you as a custom order.'}
            </p>
            <button type="button" onClick={reset} className="mt-4 text-sm font-medium text-primary hover:underline">
              Clear filters
            </button>
          </div>
        )}
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setFiltersOpen(false)}
            aria-label="Close filters"
          />
          <div className="relative ml-auto h-full w-80 max-w-[85vw] overflow-y-auto bg-background p-6">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-serif text-2xl font-semibold">Filters</p>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <X className="size-5" />
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}
    </div>
  )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded accent-primary"
      />
      {label}
    </label>
  )
}
