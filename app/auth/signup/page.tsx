'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AuthCard } from '../login/page'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    const form = new FormData(event.currentTarget)
    const role = String(form.get('role'))
    const destination = role === 'artisan' ? '/dashboard/artisan' : '/dashboard/customer'
    let data: Awaited<ReturnType<ReturnType<typeof createClient>['auth']['signUp']>>['data']
    try {
      const result = await createClient().auth.signUp({ email: String(form.get('email')), password: String(form.get('password')), options: { data: { full_name: String(form.get('name')), requested_role: role }, emailRedirectTo: `${window.location.origin}/auth/callback?next=${destination}` } })
      if (result.error) return setError(result.error.message)
      data = result.data
    } catch (reason) { return setError(reason instanceof Error ? reason.message : 'Account creation failed.') }
    finally { setBusy(false) }
    if (data.session) window.location.assign(destination)
    else setMessage('Check your email to confirm your account, then sign in.')
  }
  return <AuthCard title="Create your account" description="Join Emaarket as a customer or artisan."><form onSubmit={submit} className="grid gap-4"><label className="grid gap-1 text-sm">Full name<input required name="name" autoComplete="name" className="h-11 rounded-lg border border-input bg-card px-3" /></label><label className="grid gap-1 text-sm">Email<input required type="email" name="email" autoComplete="email" className="h-11 rounded-lg border border-input bg-card px-3" /></label><label className="grid gap-1 text-sm">Password<input required minLength={8} type="password" name="password" autoComplete="new-password" className="h-11 rounded-lg border border-input bg-card px-3" /></label><label className="grid gap-1 text-sm">Account type<select name="role" className="h-11 rounded-lg border border-input bg-card px-3"><option value="customer">Customer</option><option value="artisan">Artisan / Seller</option></select></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-primary">{message}</p>}<button disabled={busy} className="h-11 rounded-full bg-primary font-medium text-primary-foreground">{busy ? 'Creating account…' : 'Create account'}</button><p className="text-sm text-muted-foreground">Already registered? <Link className="text-primary underline" href="/auth/login">Sign in</Link></p></form></AuthCard>
}
