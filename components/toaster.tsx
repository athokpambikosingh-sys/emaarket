'use client'

import { Check } from 'lucide-react'
import { useStore } from '@/lib/store'

export function Toaster() {
  const { toasts } = useStore()
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex animate-in items-center gap-3 rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-lg fade-in slide-in-from-bottom-2"
        >
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gold text-gold-foreground">
            <Check className="size-3" />
          </span>
          {t.message}
        </div>
      ))}
    </div>
  )
}
