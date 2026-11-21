import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  const next = url.searchParams.get('next') || '/dashboard/customer'
  if (code || (tokenHash && type === 'email')) {
    const supabase = await createClient()
    const { error } = tokenHash && type === 'email'
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' })
      : await supabase.auth.exchangeCodeForSession(code!)
    if (!error) return NextResponse.redirect(new URL(next.startsWith('/') && !next.startsWith('//') ? next : '/', url.origin))
  }
  return NextResponse.redirect(new URL('/auth/login?error=confirmation', url.origin))
}
