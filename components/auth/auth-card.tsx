import type { ReactNode } from 'react'

export function AuthCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <section className="rounded-2xl border border-border bg-card p-7">
        <h1 className="font-serif text-3xl">{title}</h1>
        <p className="mb-6 mt-2 text-sm text-muted-foreground">{description}</p>
        {children}
      </section>
    </main>
  )
}
