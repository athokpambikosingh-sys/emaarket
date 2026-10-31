'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { formatTime } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { Conversation } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChatThread } from './chat-thread'

export function ChatInbox({
  conversations,
  viewer,
  initialId,
  className,
}: {
  conversations: Conversation[]
  viewer: 'customer' | 'artisan'
  initialId?: string
  className?: string
}) {
  const { getArtisan, markConversationRead } = useStore()
  const [activeId, setActiveId] = useState<string | undefined>(
    conversations.some((c) => c.id === initialId) ? initialId : undefined,
  )
  const [mobileThread, setMobileThread] = useState(Boolean(initialId))
  const active = conversations.find((c) => c.id === (activeId ?? conversations[0]?.id))
  const activeUnread = active?.unread

  useEffect(() => {
    if (active && activeUnread) markConversationRead(active.id)
  }, [active, activeUnread, markConversationRead])

  if (conversations.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 text-center', className)}>
        <MessageCircle className="size-10 text-muted-foreground" aria-hidden="true" />
        <p className="mt-4 font-serif text-2xl font-semibold">No conversations yet</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Open any product or artisan profile and tap &ldquo;Chat with artisan&rdquo; to start one.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[300px_1fr]', className)}>
      <ul
        className={cn('min-h-0 overflow-y-auto border-r border-border', mobileThread && 'hidden md:block')}
        aria-label="Conversations"
      >
        {conversations.map((c) => {
          const artisan = getArtisan(c.artisanId)
          const last = c.messages.at(-1)
          const name = viewer === 'customer' ? artisan?.name : c.customerName
          const isActive = c.id === active?.id
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveId(c.id)
                  setMobileThread(true)
                }}
                aria-current={isActive}
                className={cn(
                  'flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors',
                  isActive ? 'bg-secondary' : 'hover:bg-muted/60',
                )}
              >
                {viewer === 'customer' && artisan ? (
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-full">
                    <Image src={artisan.image || '/placeholder.svg'} alt="" fill sizes="44px" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary font-serif text-lg font-semibold text-primary">
                    {c.customerName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn('truncate text-sm', c.unread ? 'font-semibold' : 'font-medium')}>{name}</p>
                    {last && <span className="shrink-0 text-[11px] text-muted-foreground">{formatTime(last.time)}</span>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {last ? (last.kind === 'offer' ? 'Sent an offer' : last.text) : 'New conversation'}
                  </p>
                </div>
                {c.unread && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
              </button>
            </li>
          )
        })}
      </ul>
      <div className={cn('min-h-0', !mobileThread && 'hidden md:block')}>
        {active && (
          <ChatThread key={active.id} conversation={active} viewer={viewer} onBack={() => setMobileThread(false)} />
        )}
      </div>
    </div>
  )
}
