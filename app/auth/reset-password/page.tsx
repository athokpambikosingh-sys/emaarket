'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AuthCard } from '../login/page'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); setError(''); setBusy(true)
    const email = String(new FormData(event.currentTarget).get('email'))
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password` })
      if (error) setError(error.message); else setMessage('If an account exists for that email, a password reset link has been sent.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Password reset failed.') }
    finally { setBusy(false) }
  }
  return <AuthCard title="Reset password" description="We’ll email you a secure password reset link."><form onSubmit={submit} className="grid gap-4"><label className="grid gap-1 text-sm">Email<input required type="email" name="email" autoComplete="email" className="h-11 rounded-lg border border-input bg-card px-3" /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-primary">{message}</p>}<button className="h-11 rounded-full bg-primary font-medium text-primary-foreground">Send reset link</button><Link href="/auth/login" className="text-sm text-primary underline">Back to sign in</Link></form></AuthCard>
}
