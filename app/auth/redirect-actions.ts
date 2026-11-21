'use server'

import { createClient } from '@/lib/supabase/server'

function getSiteUrl() {
  return process.env.SITE_URL?.trim().replace(/\/+$/, '') || 'http://localhost:3000'
}

export async function createAccount(formData: FormData) {
  const fullName = String(formData.get('name') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const requestedRole = formData.get('role') === 'artisan' ? 'artisan' : 'customer'
  const destination = requestedRole === 'artisan' ? '/dashboard/artisan' : '/dashboard/customer'

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, requested_role: requestedRole },
        emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${destination}`,
      },
    })
    if (error) return { error: error.message, hasSession: false, destination }
    return { error: null, hasSession: Boolean(data.session), destination }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Account creation failed.', hasSession: false, destination }
  }
}

export async function sendPasswordReset(email: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/auth/update-password`,
    })
    return { error: error?.message || null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Password reset failed.' }
  }
}
