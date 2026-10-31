'use client'

import Link from 'next/link'
import { useStore } from '@/lib/store'
import { ChatInbox } from './chat-inbox'

export function CustomerMessages({ initialId }: { initialId?: string }) {
  const { conversations, currentUser, currentArtisanId, loading } = useStore()
  if (loading) return <p className="mt-8 text-center text-sm text-muted-foreground" role="status">Loading conversations…</p>
  if (!currentUser) return <p className="mt-8 rounded-xl border border-border bg-card p-8 text-center text-sm">Sign in to view your conversations. <Link className="text-primary underline" href="/auth/login?next=/messages">Sign in</Link></p>
  const viewer = currentUser.role === 'artisan' ? 'artisan' : 'customer'
  const mine = viewer === 'artisan' ? conversations.filter((conversation) => conversation.artisanId === currentArtisanId) : conversations
  return <ChatInbox conversations={mine} viewer={viewer} initialId={initialId} className="mt-8 h-[70vh] min-h-[520px]" />
}
