'use client'

import { Calendar, Package } from 'lucide-react'
import { useState } from 'react'
import { categories } from '@/lib/data'
import { formatDate, formatINR } from '@/lib/format'
import { useStore } from '@/lib/store'
import { Badge } from '../shared'

export function ArtisanBulk({ artisanId }: { artisanId: string }) {
  const { bulkRequests, respondToBulkRequest } = useStore()
  const list = bulkRequests.filter((b) => b.artisanId === artisanId || !b.artisanId)

  if (list.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">No bulk requests yet.</p>
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {list.map((b) => (
        <li key={b.id} className="flex flex-col rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{b.business}</p>
              <p className="text-xs text-muted-foreground">
                {b.name} · {b.id} · {formatDate(b.date)}
              </p>
            </div>
            <Badge tone={b.status === 'Submitted' ? 'maroon' : b.status === 'Quoted' ? 'gold' : 'success'}>{b.status}</Badge>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Category</dt>
              <dd className="font-medium">{categories.find((c) => c.id === b.category)?.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Quantity</dt>
              <dd className="flex items-center gap-1 font-medium">
                <Package className="size-3.5" aria-hidden="true" /> {b.quantity}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Budget</dt>
              <dd className="font-medium">{formatINR(b.budget)}</dd>
            </div>
          </dl>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5" aria-hidden="true" /> Needed by {formatDate(b.deadline)}
          </p>
          <p className="mt-3 rounded-lg bg-muted/60 p-3 text-sm leading-relaxed">{b.customization}</p>
          {b.responseAmount && <p className="mt-3 text-sm font-medium text-primary">Your quote: {formatINR(b.responseAmount)} per piece {b.responseNote && `· ${b.responseNote}`}</p>}
          <QuoteForm id={b.id} initialAmount={b.responseAmount} onSubmit={(amount, note) => respondToBulkRequest(b.id, amount, note)} />
          <div className="mt-4 flex flex-wrap gap-2 pt-1">
            <a
              href={`mailto:${b.email}?subject=Quote for ${b.id}`}
              className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-maroon-deep"
            >
              Send quote by email
            </a>
            <a href={`tel:${b.phone.replace(/\s/g, '')}`} className="rounded-full border border-input px-4 py-2 text-xs font-medium hover:border-primary">
              Call {b.phone}
            </a>
          </div>
        </li>
      ))}
    </ul>
  )
}

function QuoteForm({ id, initialAmount, onSubmit }: { id: string; initialAmount?: number; onSubmit: (amount: number, note: string) => void }) {
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '')
  const [note, setNote] = useState('')
  return <form className="mt-4 grid grid-cols-[1fr_2fr_auto] gap-2" onSubmit={(event) => { event.preventDefault(); const value = Number(amount); if (value > 0) onSubmit(value, note) }}>
    <label className="sr-only" htmlFor={`quote-amount-${id}`}>Quote per piece</label>
    <input id={`quote-amount-${id}`} type="number" min={1} required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="₹ per piece" className="h-9 min-w-0 rounded-md border border-input bg-background px-2 text-sm" />
    <label className="sr-only" htmlFor={`quote-note-${id}`}>Quote note</label>
    <input id={`quote-note-${id}`} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note for customer" className="h-9 min-w-0 rounded-md border border-input bg-background px-2 text-sm" />
    <button className="rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground">Send quote</button>
  </form>
}
