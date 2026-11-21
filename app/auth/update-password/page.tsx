'use client'

import { useState } from 'react'
import { AuthCard } from '@/components/auth/auth-card'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true)
    const password = String(new FormData(event.currentTarget).get('password'))
    try {
      const { error } = await createClient().auth.updateUser({ password })
      if (error) setError(error.message); else setMessage('Password updated. You can now sign in with your new password.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Password update failed.') }
    finally { setBusy(false) }
  }
  return <AuthCard title="Choose a new password" description="Use at least eight characters."><form onSubmit={submit} className="grid gap-4"><label className="grid gap-1 text-sm">New password<input required minLength={8} type="password" name="password" autoComplete="new-password" className="h-11 rounded-lg border border-input bg-card px-3" /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-primary">{message}</p>}<button className="h-11 rounded-full bg-primary font-medium text-primary-foreground">Update password</button></form></AuthCard>
}
