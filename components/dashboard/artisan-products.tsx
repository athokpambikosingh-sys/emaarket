'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { categories } from '@/lib/data'
import { formatINR } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { CategoryId, Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { buttonClass, inputClass } from '../shared'

const categoryImage: Record<CategoryId, string> = {
  phanek: '/images/phanek.png',
  innaphi: '/images/innaphi.png',
  shawls: '/images/shawl.png',
  bamboo: '/images/bamboo.png',
  pottery: '/images/pottery.png',
  accessories: '/images/accessories.png',
}

export function ArtisanProducts({ artisanId }: { artisanId: string }) {
  const { products, addProduct, updateProduct, deleteProduct } = useStore()
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [saving, setSaving] = useState(false)
  const listings = products.filter((p) => p.artisanId === artisanId)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const category = String(f.get('category')) as CategoryId
    const imageValue = f.get('image')
    const imageFile = imageValue instanceof File && imageValue.size ? imageValue : undefined
    const data = {
      name: String(f.get('name')),
      category,
      price: Number(f.get('price')),
      stock: Number(f.get('stock')),
      description: String(f.get('description')),
      material: String(f.get('material')),
      dimensions: String(f.get('dimensions')),
      care: 'Gentle hand wash or dry clean. Store away from direct sunlight.',
      customizable: f.get('customizable') === 'on',
      bulkAvailable: f.get('bulkAvailable') === 'on',
      minBulkQty: f.get('bulkAvailable') === 'on' ? 10 : undefined,
      featured: f.get('featured') === 'on',
    }
    setSaving(true)
    try {
      if (editing === 'new') {
        const created = await addProduct({ ...data, artisanId, image: categoryImage[category] }, imageFile)
        if (created) setEditing(null)
      } else if (editing) {
        if (await updateProduct(editing.id, data, imageFile)) setEditing(null)
      }
    } finally { setSaving(false) }
  }

  const current = editing && editing !== 'new' ? editing : undefined

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{listings.length} listings</p>
        <button type="button" onClick={() => setEditing('new')} className={buttonClass.primary}>
          <Plus className="size-4" /> Add product
        </button>
      </div>

      {editing && (
        <form
          key={current?.id ?? 'new'}
          onSubmit={onSubmit}
          className="mt-6 grid gap-4 rounded-xl border-2 border-gold/50 bg-card p-6 sm:grid-cols-2"
        >
          <div className="flex items-center justify-between sm:col-span-2">
            <h2 className="text-2xl font-semibold">{current ? 'Edit product' : 'New product'}</h2>
            <button type="button" onClick={() => setEditing(null)} aria-label="Close form">
              <X className="size-5" />
            </button>
          </div>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium">Product name</span>
            <input name="name" required defaultValue={current?.name} className={inputClass} />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium">Category</span>
            <select name="category" defaultValue={current?.category ?? 'phanek'} className={inputClass}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="mb-1.5 block font-medium">Price (₹)</span>
              <input name="price" type="number" min={1} required defaultValue={current?.price} className={inputClass} />
            </label>
            <label className="text-sm">
              <span className="mb-1.5 block font-medium">Stock</span>
              <input name="stock" type="number" min={0} required defaultValue={current?.stock ?? 5} className={inputClass} />
            </label>
          </div>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium">Material</span>
            <input name="material" required defaultValue={current?.material} placeholder="Handspun cotton" className={inputClass} />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium">Dimensions</span>
            <input name="dimensions" required defaultValue={current?.dimensions} placeholder="1.5 m × 1 m" className={inputClass} />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium">Product image (optional)</span>
            <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className={inputClass} />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium">Description</span>
            <textarea
              name="description"
              required
              rows={3}
              defaultValue={current?.description}
              className={cn(inputClass, 'h-auto py-3')}
            />
          </label>
          <div className="flex flex-wrap gap-6 text-sm sm:col-span-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="customizable" defaultChecked={current?.customizable ?? true} className="size-4 accent-primary" />
              Accepts customisation
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="bulkAvailable" defaultChecked={current?.bulkAvailable ?? false} className="size-4 accent-primary" />
              Available in bulk
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="featured" defaultChecked={current?.featured ?? false} className="size-4 accent-primary" />
              Feature on home page
            </label>
          </div>
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={saving} className={buttonClass.primary}>
              {saving ? 'Saving…' : current ? 'Save changes' : 'Publish listing'}
            </button>
            <button type="button" onClick={() => setEditing(null)} className={buttonClass.outline}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <ul className="mt-6 divide-y divide-border rounded-xl border border-border bg-card">
        {listings.map((p) => (
          <li key={p.id} className="flex items-center gap-4 p-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
              <Image src={p.image || '/placeholder.svg'} alt="" fill sizes="64px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.name}</p>
              <p className="text-xs text-muted-foreground">
                {categories.find((c) => c.id === p.category)?.name} ·{' '}
                <span className={p.stock <= 3 ? 'font-medium text-primary' : ''}>{p.stock} in stock</span>
              </p>
            </div>
            <p className="hidden font-semibold sm:block">{formatINR(p.price)}</p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setEditing(p)}
                className="flex size-9 items-center justify-center rounded-full hover:bg-muted"
                aria-label={`Edit ${p.name}`}
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Remove "${p.name}" from your shop?`)) deleteProduct(p.id)
                }}
                className="flex size-9 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
                aria-label={`Delete ${p.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
