export function SupabaseConfigNotice() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
  return <div role="status" className="border-b border-gold/40 bg-gold/10 px-4 py-2 text-center text-xs text-foreground">
    Supabase isn’t configured yet. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to load live marketplace data.
  </div>
}
