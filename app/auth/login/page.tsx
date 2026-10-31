'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const params = useSearchParams()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    const form = new FormData(event.currentTarget)
    try {
      const { error } = await createClient().auth.signInWithPassword({ email: String(form.get('email')), password: String(form.get('password')) })
      if (error) return setError(error.message)
    } catch (reason) { return setError(reason instanceof Error ? reason.message : 'Sign in failed.') }
    finally { setBusy(false) }
    const next = params.get('next') || '/dashboard/customer'
    window.location.assign(next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard/customer')
  }
  return <AuthCard title="Welcome back" description="Sign in to your Emaarket account."><form onSubmit={submit} className="grid gap-4"><label className="grid gap-1 text-sm">Email<input required type="email" name="email" autoComplete="email" className="h-11 rounded-lg border border-input bg-card px-3" /></label><label className="grid gap-1 text-sm">Password<input required type="password" name="password" autoComplete="current-password" className="h-11 rounded-lg border border-input bg-card px-3" /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<button disabled={busy} className="h-11 rounded-full bg-primary font-medium text-primary-foreground">{busy ? 'Signing in…' : 'Sign in'}</button><Link className="text-sm text-primary underline" href="/auth/reset-password">Forgot password?</Link><p className="text-sm text-muted-foreground">New to Emaarket? <Link className="text-primary underline" href="/auth/signup">Create an account</Link></p></form></AuthCard>
}

function AuthCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <main className="mx-auto max-w-md px-4 py-16"><section className="rounded-2xl border border-border bg-card p-7"><h1 className="font-serif text-3xl">{title}</h1><p className="mb-6 mt-2 text-sm text-muted-foreground">{description}</p>{children}</section></main> }
export default function LoginPage() { return <Suspense><LoginForm /></Suspense> }
export { AuthCard }
