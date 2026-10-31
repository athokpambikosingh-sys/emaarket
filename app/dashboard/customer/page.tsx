import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CustomerDashboard } from '@/components/dashboard/customer-dashboard'

export const metadata: Metadata = { title: 'My account' }

export default async function CustomerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/dashboard/customer')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'artisan') redirect('/dashboard/artisan')
  if (profile?.role === 'admin') redirect('/dashboard/admin')
  return <CustomerDashboard />
}
