'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, HandCoins, Send } from 'lucide-react'
import { formatINR, formatTime } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { Conversation } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ChatThread({
  conversation,
  viewer,
  onBack,
}: {
  conversation: Conversation
  viewer: 'customer' | 'artisan'
  onBack?: () => void
}) {
  const { getArtisan, getProduct, sendMessage } = useStore()
  const [text, setText] = useState('')
  const [offerMode, setOfferMode] = useState(false)
  const [offer, setOffer] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const artisan = getArtisan(conversation.artisanId)
  const product = conversation.productId ? getProduct(conversation.productId) : undefined
  const counterpartName = viewer === 'customer' ? artisan?.name : conversation.customerName
  const lastMessageId = conversation.messages.at(-1)?.id

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [lastMessageId])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (offerMode) {
      const amount = Number(offer)
      if (!amount || amount <= 0) return
      sendMessage(conversation.id, text.trim() || `I'd like to offer ${formatINR(amount)} per piece.`, {
        kind: 'offer',
        offerAmount: amount,
        from: viewer,
      })
      setOffer('')
      setOfferMode(false)
    } else {
      if (!text.trim()) return
      sendMessage(conversation.id, text.trim(), { from: viewer })
    }
    setText('')
  }

  function acceptOffer(amount: number) {
    sendMessage(conversation.id, `Deal! I accept ${formatINR(amount)} per piece.`, { from: viewer })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        {onBack && (
          <button type="button" onClick={onBack} className="md:hidden" aria-label="Back to conversations">
            <ArrowLeft className="size-5" />
          </button>
        )}
        {viewer === 'customer' && artisan ? (
          <div className="relative size-10 overflow-hidden rounded-full">
            <Image src={artisan.image || '/placeholder.svg'} alt="" fill sizes="40px" className="object-cover" />
          </div>
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-secondary font-serif text-lg font-semibold text-primary">
            {conversation.customerName.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium">{counterpartName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {viewer === 'customer' ? `${artisan?.craft} · usually replies within an hour` : 'Customer'}
          </p>
        </div>
      </header>

      {product && (
        <Link
          href={`/products/${product.slug}`}
          className="flex items-center gap-3 border-b border-border bg-secondary/60 px-4 py-2.5 hover:bg-secondary"
        >
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md">
            <Image src={product.image || '/placeholder.svg'} alt="" fill sizes="40px" className="object-cover" />
          </div>
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">Listed at {formatINR(product.price)}</p>
          </div>
        </Link>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6" aria-live="polite">
        {conversation.messages.length === 0 && (
          <p className="mx-auto max-w-xs text-center text-sm text-muted-foreground">
            Say hello! Ask about colours, sizing, delivery, or make an offer for bulk quantities.
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {conversation.messages.map((m) => {
            const mine = m.from === viewer
            return (
              <li key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
                {m.kind === 'offer' && m.offerAmount ? (
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl border-2 p-4',
                      mine ? 'border-primary bg-primary/5' : 'border-gold bg-gold/10',
                    )}
                  >
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
                      <HandCoins className="size-3.5" aria-hidden="true" /> {mine ? 'Your offer' : 'Offer received'}
                    </p>
                    <p className="mt-1 font-serif text-3xl font-semibold text-primary">{formatINR(m.offerAmount)}</p>
                    <p className="mt-1 text-sm">{m.text}</p>
                    {!mine && (
                      <button
                        type="button"
                        onClick={() => acceptOffer(m.offerAmount!)}
                        className="mt-3 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-maroon-deep"
                      >
                        Accept offer
                      </button>
                    )}
                  </div>
                ) : (
                  <p
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      mine ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-muted',
                    )}
                  >
                    {m.text}
                  </p>
                )}
                <span className="mt-1 text-[11px] text-muted-foreground">{formatTime(m.time)}</span>
              </li>
            )
          })}
        </ul>
      </div>

      <form onSubmit={submit} className="border-t border-border p-3">
        {offerMode && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2">
            <label htmlFor={`offer-${conversation.id}`} className="text-xs font-medium text-[#7a5520]">
              Offer per piece (₹)
            </label>
            <input
              id={`offer-${conversation.id}`}
              type="number"
              min={1}
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              placeholder={product ? String(Math.round(product.price * 0.9)) : '1500'}
              className="h-8 w-28 rounded-md border border-input bg-card px-2 text-sm outline-none focus:border-gold"
              autoFocus
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOfferMode((v) => !v)}
            aria-pressed={offerMode}
            className={cn(
              'flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium',
              offerMode ? 'border-gold bg-gold text-gold-foreground' : 'border-input hover:border-gold',
            )}
          >
            <HandCoins className="size-4" />
            <span className="hidden sm:inline">Offer</span>
          </button>
          <label htmlFor={`msg-${conversation.id}`} className="sr-only">
            Message
          </label>
          <input
            id={`msg-${conversation.id}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
            }}
            placeholder={offerMode ? 'Add a note (optional)' : 'Write a message…'}
            className="h-11 flex-1 rounded-full border border-input bg-card px-4 text-sm outline-none focus:border-gold"
            autoComplete="off"
          />
          <button
            type="submit"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-maroon-deep"
            aria-label="Send"
          >
            <Send className="size-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
