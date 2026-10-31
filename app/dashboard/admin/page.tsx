import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared'
import { AdminConsole } from '@/components/admin/admin-console'

export const metadata = { title: 'Admin dashboard' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/dashboard/admin')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard/customer')
  return <div className="mx-auto max-w-7xl px-4 py-10 md:px-6"><PageHeader eyebrow="Administration" title="Admin dashboard" description="Manage user roles, product listings, and marketplace activity." /><AdminConsole /></div>
}
