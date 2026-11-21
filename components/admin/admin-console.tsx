'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatINR } from '@/lib/format'

type UserRow = { id: string; full_name: string; role: 'customer' | 'artisan' | 'admin'; created_at: string }
type ProductRow = { id: string; name: string; price: number; status: 'draft' | 'published' | 'archived' }
type ArtisanRow = { id: string; display_name: string; user_id: string; verified: boolean; is_active: boolean }

export function AdminConsole() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [artisans, setArtisans] = useState<ArtisanRow[]>([])
  const [activity, setActivity] = useState({ orders: 0, bulkRequests: 0 })
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
    const supabase = createClient()
    const [userRows, productRows, artisanRows, orderRows, bulkRows] = await Promise.all([
      supabase.from('profiles').select('id, full_name, role, created_at').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, price, status').order('created_at', { ascending: false }),
      supabase.from('artisan_profiles').select('id, display_name, user_id, verified, is_active').order('created_at', { ascending: false }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('bulk_order_requests').select('id', { count: 'exact', head: true }),
    ])
    const issue = userRows.error || productRows.error || artisanRows.error || orderRows.error || bulkRows.error
    if (issue) { setError(issue.message); return }
    setUsers((userRows.data || []) as UserRow[])
    setProducts((productRows.data || []) as ProductRow[])
    setArtisans((artisanRows.data || []) as ArtisanRow[])
    setActivity({ orders: orderRows.count || 0, bulkRequests: bulkRows.count || 0 })
    setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load admin data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function setRole(id: string, role: UserRow['role']) {
    setBusyId(id); setError('')
    const { error: updateError } = await createClient().from('profiles').update({ role }).eq('id', id)
    if (updateError) setError(updateError.message); else await load()
    setBusyId('')
  }

  async function setProductStatus(id: string, status: ProductRow['status']) {
    setBusyId(id); setError('')
    const { error: updateError } = await createClient().from('products').update({ status }).eq('id', id)
    if (updateError) setError(updateError.message); else await load()
    setBusyId('')
  }

  async function setArtisanControl(id: string, values: Partial<Pick<ArtisanRow, 'verified' | 'is_active'>>) {
    setBusyId(id); setError('')
    const { error: updateError } = await createClient().from('artisan_profiles').update(values).eq('id', id)
    if (updateError) setError(updateError.message); else await load()
    setBusyId('')
  }

  return <div className="mt-8 grid gap-8">
    {loading && <p role="status" className="text-sm text-muted-foreground">Loading admin data…</p>}
    {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><p>{error}</p><button type="button" onClick={() => void load()} className="mt-2 font-medium underline">Try again</button></div>}
    <section className="grid gap-4 sm:grid-cols-2">
      <Metric label="Orders" value={activity.orders} />
      <Metric label="Bulk requests" value={activity.bulkRequests} />
    </section>
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border p-5"><h2 className="font-serif text-2xl font-semibold">Artisan verification</h2><p className="mt-1 text-sm text-muted-foreground">Active artisans can be discovered publicly. Verification is an admin-managed trust badge.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-muted/60 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Artisan</th><th className="px-4 py-3">Verified</th><th className="px-4 py-3">Active</th></tr></thead><tbody className="divide-y divide-border">{artisans.map((artisan) => <tr key={artisan.id}><td className="px-4 py-3 font-medium">{artisan.display_name}</td><td className="px-4 py-3"><input aria-label={`Verify ${artisan.display_name}`} type="checkbox" disabled={busyId === artisan.id} checked={artisan.verified} onChange={(event) => void setArtisanControl(artisan.id, { verified: event.target.checked })} /></td><td className="px-4 py-3"><input aria-label={`Activate ${artisan.display_name}`} type="checkbox" disabled={busyId === artisan.id} checked={artisan.is_active} onChange={(event) => void setArtisanControl(artisan.id, { is_active: event.target.checked })} /></td></tr>)}</tbody></table></div>
    </section>
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border p-5"><h2 className="font-serif text-2xl font-semibold">User roles</h2><p className="mt-1 text-sm text-muted-foreground">Role changes are checked by database policies.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-muted/60 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Role</th></tr></thead><tbody className="divide-y divide-border">{users.map((user) => <tr key={user.id}><td className="px-4 py-3"><p className="font-medium">{user.full_name || 'Unnamed account'}</p><p className="font-mono text-[11px] text-muted-foreground">{user.id}</p></td><td className="px-4 py-3">{formatDate(user.created_at)}</td><td className="px-4 py-3"><label className="sr-only" htmlFor={`user-role-${user.id}`}>Role for {user.full_name}</label><select id={`user-role-${user.id}`} disabled={busyId === user.id} value={user.role} onChange={(event) => void setRole(user.id, event.target.value as UserRow['role'])} className="h-9 rounded-md border border-input bg-background px-2"><option value="customer">Customer</option><option value="artisan">Artisan / Seller</option><option value="admin">Admin</option></select></td></tr>)}</tbody></table></div>
    </section>
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border p-5"><h2 className="font-serif text-2xl font-semibold">Product moderation</h2><p className="mt-1 text-sm text-muted-foreground">Publish, archive, or return listings to draft.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-muted/60 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-border">{products.map((product) => <tr key={product.id}><td className="px-4 py-3 font-medium">{product.name}</td><td className="px-4 py-3">{formatINR(Number(product.price))}</td><td className="px-4 py-3"><label className="sr-only" htmlFor={`product-status-${product.id}`}>Status for {product.name}</label><select id={`product-status-${product.id}`} disabled={busyId === product.id} value={product.status} onChange={(event) => void setProductStatus(product.id, event.target.value as ProductRow['status'])} className="h-9 rounded-md border border-input bg-background px-2"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></td></tr>)}</tbody></table></div>
    </section>
  </div>
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-border bg-card p-5"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 font-serif text-4xl font-semibold text-primary">{value}</p></div> }
