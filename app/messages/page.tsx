import type { Metadata } from 'next'
import { CustomerMessages } from '@/components/chat/customer-messages'

export const metadata: Metadata = { title: 'Messages' }

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="text-4xl font-semibold md:text-5xl">Messages</h1>
      <p className="mt-2 text-muted-foreground">Talk directly with artisans, ask questions, and negotiate prices.</p>
      <CustomerMessages key={c} initialId={c} />
    </div>
  )
}
