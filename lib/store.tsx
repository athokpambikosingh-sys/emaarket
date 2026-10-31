'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from './supabase/client'
import { uid } from './format'
import type { Artisan, BulkRequest, CartItem, Conversation, MessageKind, Order, OrderStatus, Product } from './types'

type Toast = { id: string; message: string }
type StoreUser = { id: string; name: string; email: string; role: 'customer' | 'artisan' | 'admin' }
const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

type StoreValue = {
  products: Product[]; artisans: Artisan[]; cart: CartItem[]; wishlist: string[]; orders: Order[]
  conversations: Conversation[]; bulkRequests: BulkRequest[]; toasts: Toast[]; currentUser: StoreUser | null
  currentArtisanId: string | null; loading: boolean; catalogError: string
  getProduct: (id: string) => Product | undefined; getArtisan: (id: string) => Artisan | undefined
  addToCart: (productId: string, quantity?: number) => void; updateCartQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void; toggleWishlist: (productId: string) => void
  placeOrder: (shipping: { name: string; phone: string; address: string; city: string; pin: string }) => Promise<Order | null>
  startConversation: (artisanId: string, productId?: string) => Promise<string>
  sendMessage: (conversationId: string, text: string, options?: { kind?: MessageKind; offerAmount?: number; from?: 'customer' | 'artisan' }) => void
  markConversationRead: (conversationId: string) => void
  submitBulkRequest: (request: Omit<BulkRequest, 'id' | 'status' | 'date'>) => Promise<BulkRequest | null>
  respondToBulkRequest: (id: string, amount: number, note: string) => void
  addProduct: (product: Omit<Product, 'id' | 'slug' | 'rating' | 'reviews'>, imageFile?: File) => Promise<Product | null>
  updateProduct: (id: string, patch: Partial<Product>, imageFile?: File) => Promise<boolean>
  deleteProduct: (id: string) => void; updateOrderStatus: (id: string, status: OrderStatus) => void
  submitReview: (productId: string, rating: number, title: string, body: string) => Promise<void>
  uploadArtisanImage: (file: File) => Promise<void>; notify: (message: string) => void
}
const StoreContext = createContext<StoreValue | null>(null)

function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
function titleStatus(value: string): OrderStatus { return (value[0].toUpperCase() + value.slice(1)) as OrderStatus }
function bulkStatus(value: string): BulkRequest['status'] {
  const statuses: Record<string, BulkRequest['status']> = { submitted: 'Submitted', quoted: 'Quoted', accepted: 'Accepted', declined: 'Declined' }
  return statuses[value] || 'Submitted'
}
function storageUrl(path?: string | null) {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('/')) return path
  return createClient().storage.from('product-images').getPublicUrl(path).data.publicUrl
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [bulkRequests, setBulkRequests] = useState<BulkRequest[]>([])
  const [currentUser, setCurrentUser] = useState<StoreUser | null>(null)
  const [currentArtisanId, setCurrentArtisanId] = useState<string | null>(null)
  const [loading, setLoading] = useState(configured)
  const [catalogError, setCatalogError] = useState(configured ? '' : 'Supabase is not configured. Add the project URL and publishable key to load marketplace listings.')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [reload, setReload] = useState(0)
  const userRef = useRef<StoreUser | null>(null)
  const artisanRef = useRef<string | null>(null)
  const productsRef = useRef(products)
  const conversationsRef = useRef(conversations)
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  productsRef.current = products
  conversationsRef.current = conversations
  userRef.current = currentUser
  artisanRef.current = currentArtisanId

  const notify = useCallback((message: string) => {
    const id = uid('t')
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3000)
  }, [])
  const scheduleReload = useCallback(() => {
    if (reloadTimer.current) clearTimeout(reloadTimer.current)
    reloadTimer.current = setTimeout(() => setReload((n) => n + 1), 120)
  }, [])

  useEffect(() => {
    if (!configured) return
    const supabase = createClient()
    let alive = true
    let channel: ReturnType<typeof supabase.channel> | undefined
    async function load() {
      setLoading(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!alive) return
      if (authError) notify(authError.message)
      let appUser: StoreUser | null = null
      let myArtisanId: string | null = null
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle()
        if (profile) {
          appUser = { id: user.id, name: profile.full_name || user.user_metadata?.full_name || user.email || 'Member', email: user.email || '', role: profile.role }
          if (profile.role === 'artisan' || profile.role === 'admin') {
            let { data: artisan } = await supabase.from('artisan_profiles').select('*').eq('user_id', user.id).maybeSingle()
            if (!artisan && profile.role === 'artisan') {
              const name = appUser.name
              const { data: created } = await supabase.from('artisan_profiles').insert({ user_id: user.id, display_name: name, slug: `${slugify(name) || 'artisan'}-${user.id.slice(0, 6)}`, is_active: true }).select('*').single()
              artisan = created
            }
            myArtisanId = artisan?.id ?? null
          }
        }
      }
      setCurrentUser(appUser)
      setCurrentArtisanId(myArtisanId)

      const [productResult, inventoryResult, imageResult, artisanResult, reviewResult] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('inventory').select('product_id, quantity, reserved'),
        supabase.from('product_images').select('product_id, storage_path, sort_order').order('sort_order'),
        supabase.from('artisan_profiles').select('*'),
        supabase.from('reviews').select('product_id, rating'),
      ])
      const inventory = new Map((inventoryResult.data || []).map((row) => [row.product_id, row]))
      const images = new Map<string, string>()
      for (const row of imageResult.data || []) if (!images.has(row.product_id)) images.set(row.product_id, storageUrl(row.storage_path))
      const ratings = new Map<string, number[]>()
      for (const row of reviewResult.data || []) ratings.set(row.product_id, [...(ratings.get(row.product_id) || []), row.rating])
      const artisanRatings = new Map<string, number[]>()
      for (const product of productResult.data || []) {
        const values = artisanRatings.get(product.artisan_id) || []
        values.push(...(ratings.get(product.id) || []))
        artisanRatings.set(product.artisan_id, values)
      }
      const mappedArtisans: Artisan[] = (artisanResult.data || []).map((a) => ({
        id: a.id, slug: a.slug, name: a.display_name, location: a.location, district: a.district, craft: a.craft,
        specialization: a.specialization || [], experienceYears: a.experience_years, bio: a.bio, story: a.story,
        image: storageUrl(a.avatar_url), rating: artisanRatings.get(a.id)?.length ? artisanRatings.get(a.id)!.reduce((sum, score) => sum + score, 0) / artisanRatings.get(a.id)!.length : 0, languages: a.languages || [], phone: a.phone || '', email: '',
        verified: a.verified, cooperative: a.cooperative || undefined, joined: a.created_at,
      }))
      const mappedProducts: Product[] = (productResult.data || []).map((p) => {
        const stockRow = inventory.get(p.id)
        const productRatings = ratings.get(p.id) || []
        return {
          id: p.id, slug: p.slug, name: p.name, category: p.category_id, price: Number(p.price),
          originalPrice: p.original_price ? Number(p.original_price) : undefined,
          image: images.get(p.id) || '/placeholder.svg', description: p.description, artisanId: p.artisan_id,
          rating: productRatings.length ? productRatings.reduce((sum, val) => sum + val, 0) / productRatings.length : 0,
          reviews: productRatings.length, stock: Math.max(0, (stockRow?.quantity || 0) - (stockRow?.reserved || 0)),
          material: p.material, dimensions: p.dimensions, care: p.care_instructions, customizable: p.customizable,
          bulkAvailable: p.bulk_available, minBulkQty: p.min_bulk_quantity || undefined, featured: p.featured,
        }
      })
      setArtisans(mappedArtisans)
      setProducts(mappedProducts)
      const loadError = productResult.error || inventoryResult.error || imageResult.error || artisanResult.error || reviewResult.error
      setCatalogError(loadError?.message || '')
      if (loadError) notify(loadError.message)

      if (user) {
        const validProductIds = new Set(mappedProducts.map((product) => product.id))
        const guestCart: CartItem[] = (typeof window === 'undefined' ? [] : JSON.parse(localStorage.getItem('emaarket-cart') || '[]')).filter((item: CartItem) => validProductIds.has(item.productId))
        const guestWishlist: string[] = (typeof window === 'undefined' ? [] : JSON.parse(localStorage.getItem('emaarket-wishlist') || '[]')).filter((id: string) => validProductIds.has(id))
        const { data: cartRow } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle()
        if (cartRow) {
          const { data: cartRows } = await supabase.from('cart_items').select('product_id, quantity').eq('cart_id', cartRow.id)
          const merged = new Map<string, number>((cartRows || []).map((row) => [row.product_id, row.quantity]))
          guestCart.forEach((item) => merged.set(item.productId, (merged.get(item.productId) || 0) + item.quantity))
          const nextCart = [...merged].map(([productId, quantity]) => ({ productId, quantity }))
          setCart(nextCart)
          if (guestCart.length) await supabase.from('cart_items').upsert(nextCart.map((item) => ({ cart_id: cartRow.id, product_id: item.productId, quantity: item.quantity })), { onConflict: 'cart_id,product_id' })
        } else if (guestCart.length) {
          const { data: createdCart } = await supabase.from('carts').insert({ user_id: user.id }).select('id').single()
          if (createdCart) {
            await supabase.from('cart_items').insert(guestCart.map((item) => ({ cart_id: createdCart.id, product_id: item.productId, quantity: item.quantity })))
            setCart(guestCart)
          }
        } else setCart([])
        if (typeof window !== 'undefined') localStorage.removeItem('emaarket-cart')
        const [wish, orderRows, itemRows, conversationRows, bulkRows] = await Promise.all([
          supabase.from('wishlists').select('product_id').eq('user_id', user.id),
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('order_items').select('*'),
          supabase.from('conversations').select('*').order('updated_at', { ascending: false }),
          supabase.from('bulk_order_requests').select('*').order('created_at', { ascending: false }),
        ])
        const savedIds = [...new Set([...(wish.data || []).map((row) => row.product_id), ...guestWishlist])]
        setWishlist(savedIds)
        if (guestWishlist.length) await supabase.from('wishlists').upsert(guestWishlist.map((product_id) => ({ user_id: user.id, product_id })), { onConflict: 'user_id,product_id' })
        if (typeof window !== 'undefined') localStorage.removeItem('emaarket-wishlist')
        const orderItems = itemRows.data || []
        setOrders((orderRows.data || []).map((o) => ({
          id: o.id, date: o.created_at, customerName: o.shipping_name, items: orderItems.filter((i) => i.order_id === o.id).map((i) => ({ productId: i.product_id || '', quantity: i.quantity, price: Number(i.unit_price), orderItemId: i.id, artisanId: i.artisan_id, productName: i.product_name, productImageUrl: i.product_image_url || undefined })),
          total: Number(o.total), status: titleStatus(o.status), city: o.shipping_address?.city || '',
        })))
        const conversationData = conversationRows.data || []
        const messageResults = await Promise.all(conversationData.map((c) => supabase.from('messages').select('*').eq('conversation_id', c.id).order('created_at')))
        setConversations(conversationData.map((c, index) => {
          const artisan = mappedArtisans.find((a) => a.id === c.artisan_id)
          const msgs = messageResults[index].data || []
          const artisanUserId = (artisanResult.data || []).find((a) => a.id === c.artisan_id)?.user_id
          const readAt = c.customer_id === user.id ? c.customer_read_at : c.artisan_read_at
          return {
            id: c.id, artisanId: c.artisan_id, customerName: c.customer_name || (c.customer_id === user.id ? appUser?.name : 'Customer'), productId: c.product_id || undefined,
            unread: Boolean(msgs.some((m) => m.sender_id !== user.id && (!readAt || m.created_at > readAt))),
            messages: msgs.map((m) => ({ id: m.id, from: m.sender_id === artisanUserId ? 'artisan' : 'customer', kind: m.kind, text: m.body, offerAmount: m.offer_amount ? Number(m.offer_amount) : undefined, time: m.created_at })),
          }
        }))
        setBulkRequests((bulkRows.data || []).map((b) => ({
          id: b.id, name: b.contact_name, business: b.business_name, email: b.email, phone: b.phone,
          category: b.category_id, quantity: b.quantity, budget: Number(b.budget || 0), deadline: b.deadline || '',
          customization: b.customization, artisanId: b.artisan_id || undefined,
          status: bulkStatus(b.status), date: b.created_at,
          productId: b.product_id || undefined, responseAmount: b.response_amount ? Number(b.response_amount) : undefined, responseNote: b.response_note || undefined,
        })))
      } else {
        setWishlist(typeof window === 'undefined' ? [] : JSON.parse(localStorage.getItem('emaarket-wishlist') || '[]'))
        setCart(typeof window === 'undefined' ? [] : JSON.parse(localStorage.getItem('emaarket-cart') || '[]'))
        setOrders([]); setConversations([]); setBulkRequests([])
      }
      if (alive) setLoading(false)

      let live = supabase.channel(`emaarket-live-${user?.id || 'public'}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, scheduleReload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, scheduleReload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'product_images' }, scheduleReload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'artisan_profiles' }, scheduleReload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, scheduleReload)
      if (user) live = live
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, scheduleReload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, scheduleReload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, scheduleReload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bulk_order_requests' }, scheduleReload)
      channel = live.subscribe()
    }
    void load()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { channel?.unsubscribe(); void load() })
    return () => { alive = false; subscription.unsubscribe(); channel?.unsubscribe() }
  }, [notify, reload, scheduleReload])

  const getProduct = useCallback((id: string) => products.find((product) => product.id === id), [products])
  const getArtisan = useCallback((id: string) => artisans.find((artisan) => artisan.id === id), [artisans])
  const refresh = useCallback(() => setReload((n) => n + 1), [])

  const syncCart = useCallback(async (next: CartItem[]) => {
    setCart(next)
    if (!configured || !userRef.current) {
      if (typeof window !== 'undefined') localStorage.setItem('emaarket-cart', JSON.stringify(next))
      if (configured && !userRef.current) notify('Sign in to save this cart to your account.')
      return
    }
    const supabase = createClient(), user = userRef.current
    let { data: row } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle()
    if (!row) {
      const result = await supabase.from('carts').insert({ user_id: user.id }).select('id').single()
      if (result.error || !result.data) return notify(result.error?.message || 'Could not create your cart.')
      row = result.data
    }
    await supabase.from('cart_items').delete().eq('cart_id', row.id)
    if (next.length) {
      const { error } = await supabase.from('cart_items').insert(next.map((item) => ({ cart_id: row!.id, product_id: item.productId, quantity: item.quantity })))
      if (error) notify(error.message)
    }
  }, [notify])

  const addToCart = useCallback((productId: string, quantity = 1) => {
    const product = productsRef.current.find((p) => p.id === productId)
    if (!product || product.stock <= 0) return
    const previous = cart
    const found = previous.find((item) => item.productId === productId)
    const next = found ? previous.map((item) => item.productId === productId ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) } : item) : [...previous, { productId, quantity: Math.min(product.stock, quantity) }]
    void syncCart(next); notify(`${product.name} added to cart`)
  }, [cart, notify, syncCart])

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    const product = productsRef.current.find((p) => p.id === productId)
    void syncCart(cart.map((item) => item.productId === productId ? { ...item, quantity: Math.max(1, Math.min(product?.stock || 1, quantity)) } : item))
  }, [cart, syncCart])
  const removeFromCart = useCallback((productId: string) => void syncCart(cart.filter((item) => item.productId !== productId)), [cart, syncCart])

  const toggleWishlist = useCallback((productId: string) => {
    const next = wishlist.includes(productId) ? wishlist.filter((id) => id !== productId) : [...wishlist, productId]
    setWishlist(next)
    if (configured && userRef.current) {
      const supabase = createClient(), user = userRef.current
      void (async () => {
        const request = next.includes(productId)
          ? supabase.from('wishlists').upsert({ user_id: user.id, product_id: productId })
          : supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId)
        const { error } = await request
        if (error) notify(error.message)
      })()
    } else if (typeof window !== 'undefined') localStorage.setItem('emaarket-wishlist', JSON.stringify(next))
    notify(next.includes(productId) ? 'Saved to wishlist' : 'Removed from wishlist')
  }, [notify, wishlist])

  const placeOrder = useCallback(async (shipping: { name: string; phone: string; address: string; city: string; pin: string }) => {
    if (!configured) {
      notify('Configure Supabase to place an order.')
      return null
    }
    if (!userRef.current) { notify('Please sign in before placing an order.'); return null }
    const supabase = createClient()
    const { data, error } = await supabase.rpc('checkout_cart', { shipping_name: shipping.name, shipping_phone: shipping.phone, shipping_address: { address: shipping.address, city: shipping.city, pin: shipping.pin } })
    if (error) { notify(error.message); return null }
    const subtotal = cart.reduce((sum, item) => sum + (getProduct(item.productId)?.price || 0) * item.quantity, 0)
    const order: Order = { id: data, date: new Date().toISOString(), customerName: shipping.name, items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity, price: getProduct(item.productId)?.price || 0, artisanId: getProduct(item.productId)?.artisanId, productName: getProduct(item.productId)?.name })), total: subtotal + (subtotal >= 2500 ? 0 : 120), status: 'Pending', city: shipping.city }
    setCart([]); setOrders((prev) => [order, ...prev]); refresh(); notify(`Order placed successfully`); return order
  }, [cart, getProduct, notify, refresh])

  const startConversation = useCallback(async (artisanId: string, productId?: string) => {
    const user = userRef.current
    if (!configured) {
      notify('Configure Supabase to message artisans.')
      return ''
    }
    if (!user) { notify('Sign in to message artisans.'); return '' }
    const supabase = createClient()
    let query = supabase.from('conversations').select('id').eq('customer_id', user.id).eq('artisan_id', artisanId)
    query = productId ? query.eq('product_id', productId) : query.is('product_id', null)
    const { data: found } = await query.maybeSingle()
    if (found) return found.id
    const { data, error } = await supabase.from('conversations').insert({ customer_id: user.id, artisan_id: artisanId, product_id: productId || null, customer_name: user.name }).select('id').single()
    if (error) { notify(error.message); return '' }
    refresh(); return data.id
  }, [notify, refresh])

  const sendMessage = useCallback(async (conversationId: string, text: string, options?: { kind?: MessageKind; offerAmount?: number; from?: 'customer' | 'artisan' }) => {
    const user = userRef.current
    if (!text.trim()) return
    if (!configured) {
      notify('Configure Supabase to send messages.')
      return
    }
    if (!user) { notify('Sign in to send messages.'); return }
    const conversation = conversationsRef.current.find((item) => item.id === conversationId)
    if (!conversation) return
    const kind = options?.kind || 'text'
    const supabase = createClient()
    const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: user.id, body: text.trim(), kind, offer_amount: options?.offerAmount || null })
    if (error) notify(error.message); else refresh()
  }, [notify, refresh])

  const markConversationRead = useCallback((conversationId: string) => {
    const user = userRef.current
    if (!configured || !user) return
    const conversation = conversationsRef.current.find((item) => item.id === conversationId)
    if (!conversation) return
    setConversations((previous) => previous.map((item) => item.id === conversationId ? { ...item, unread: false } : item))
    void createClient().from('conversations').update(user.role === 'artisan' ? { artisan_read_at: new Date().toISOString() } : { customer_read_at: new Date().toISOString() }).eq('id', conversationId)
  }, [])

  const submitBulkRequest = useCallback(async (request: Omit<BulkRequest, 'id' | 'status' | 'date'>) => {
    const user = userRef.current
    if (!configured) {
      notify('Configure Supabase to submit a bulk request.')
      return null
    }
    if (!user) { notify('Sign in to submit a bulk request.'); return null }
    const { data, error } = await createClient().from('bulk_order_requests').insert({ customer_id: user.id, artisan_id: request.artisanId || null, category_id: request.category, product_id: request.productId || null, business_name: request.business, contact_name: request.name, email: request.email, phone: request.phone, quantity: request.quantity, budget: request.budget, deadline: request.deadline || null, customization: request.customization }).select('*').single()
    if (error) { notify(error.message); return null }
    const created: BulkRequest = { ...request, id: data.id, date: data.created_at, status: 'Submitted' }
    setBulkRequests((prev) => [created, ...prev]); notify('Bulk order request submitted'); return created
  }, [notify])

  const respondToBulkRequest = useCallback(async (id: string, amount: number, note: string) => {
    if (!configured) { notify('Configure Supabase to respond to bulk requests.'); return }
    const { error } = await createClient().rpc('respond_to_bulk_request', { target_request: id, quote_amount: amount, quote_note: note })
    if (error) notify(error.message); else { setBulkRequests((previous) => previous.map((request) => request.id === id ? { ...request, status: 'Quoted', responseAmount: amount, responseNote: note } : request)); refresh(); notify('Quote sent to customer') }
  }, [notify, refresh])

  const uploadFile = useCallback(async (file: File, prefix: string) => {
    const user = userRef.current
    if (!user) throw new Error('Sign in to upload images.')
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) throw new Error('Choose an image under 10 MB.')
    const path = `${user.id}/${prefix}/${uid('img')}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
    const supabase = createClient()
    const { error } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type, upsert: false })
    if (error) throw error
    return { path, url: storageUrl(path) }
  }, [])

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'slug' | 'rating' | 'reviews'>, imageFile?: File) => {
    if (!configured) {
      notify('Configure Supabase to publish products.')
      return null
    }
    const artisanId = artisanRef.current
    if (!artisanId) { notify('Create an artisan profile before adding products.'); return null }
    const { data, error } = await createClient().from('products').insert({ artisan_id: artisanId, category_id: product.category, slug: `${slugify(product.name)}-${uid('p').slice(2, 8)}`, name: product.name, description: product.description, price: product.price, material: product.material, dimensions: product.dimensions, care_instructions: product.care, customizable: product.customizable, bulk_available: product.bulkAvailable, min_bulk_quantity: product.minBulkQty, featured: product.featured || false, status: 'published' }).select('*').single()
    if (error) { notify(error.message); return null }
    const { error: stockError } = await createClient().from('inventory').upsert({ product_id: data.id, quantity: product.stock })
    if (stockError) {
      await createClient().from('products').delete().eq('id', data.id)
      notify(stockError.message)
      return null
    }
    let image = product.image
    if (imageFile) {
      try {
        const uploaded = await uploadFile(imageFile, data.id)
        const result = await createClient().from('product_images').insert({ product_id: data.id, storage_path: uploaded.path, alt_text: product.name })
        if (result.error) throw result.error
        image = uploaded.url
      } catch (reason) { notify(reason instanceof Error ? reason.message : 'Image upload failed') }
    }
    const created: Product = { ...product, id: data.id, slug: data.slug, image, rating: 0, reviews: 0 }
    setProducts((prev) => [created, ...prev]); notify('Product published to the marketplace'); return created
  }, [notify, uploadFile])

  const updateProduct = useCallback(async (id: string, patch: Partial<Product>, imageFile?: File) => {
    if (!configured) { notify('Configure Supabase to update products.'); return false }
    const dbPatch: Record<string, unknown> = {}
    if (patch.name !== undefined) dbPatch.name = patch.name
    if (patch.category !== undefined) dbPatch.category_id = patch.category
    if (patch.price !== undefined) dbPatch.price = patch.price
    if (patch.originalPrice !== undefined) dbPatch.original_price = patch.originalPrice
    if (patch.description !== undefined) dbPatch.description = patch.description
    if (patch.material !== undefined) dbPatch.material = patch.material
    if (patch.dimensions !== undefined) dbPatch.dimensions = patch.dimensions
    if (patch.care !== undefined) dbPatch.care_instructions = patch.care
    if (patch.customizable !== undefined) dbPatch.customizable = patch.customizable
    if (patch.bulkAvailable !== undefined) dbPatch.bulk_available = patch.bulkAvailable
    if (patch.minBulkQty !== undefined) dbPatch.min_bulk_quantity = patch.minBulkQty
    else if (patch.bulkAvailable === false) dbPatch.min_bulk_quantity = null
    if (patch.featured !== undefined) dbPatch.featured = patch.featured
    const { error } = await createClient().from('products').update(dbPatch).eq('id', id)
    if (error) { notify(error.message); return false }
    if (patch.stock !== undefined) {
      const result = await createClient().from('inventory').upsert({ product_id: id, quantity: patch.stock })
      if (result.error) { notify(result.error.message); return false }
    }
    if (imageFile) {
      try {
        const uploaded = await uploadFile(imageFile, id)
        const { data: oldImages } = await createClient().from('product_images').select('storage_path').eq('product_id', id)
        const result = await createClient().from('product_images').insert({ product_id: id, storage_path: uploaded.path, alt_text: patch.name || getProduct(id)?.name || '' })
        if (result.error) throw result.error
        await createClient().from('product_images').delete().eq('product_id', id).neq('storage_path', uploaded.path)
        if (oldImages?.length) await createClient().storage.from('product-images').remove(oldImages.map((row) => row.storage_path))
        patch.image = uploaded.url
      } catch (reason) { notify(reason instanceof Error ? reason.message : 'Image upload failed') }
    }
    setProducts((prev) => prev.map((product) => product.id === id ? { ...product, ...patch } : product)); notify('Product updated'); return true
  }, [getProduct, notify, uploadFile])

  const deleteProduct = useCallback(async (id: string) => {
    if (!configured) { notify('Configure Supabase to remove products.'); return }
    const supabase = createClient()
    const { data: oldImages } = await supabase.from('product_images').select('storage_path').eq('product_id', id)
    const { error } = await createClient().from('products').delete().eq('id', id)
    if (error) { notify(error.message); return }
    if (oldImages?.length) await supabase.storage.from('product-images').remove(oldImages.map((row) => row.storage_path))
    setProducts((prev) => prev.filter((product) => product.id !== id)); void syncCart(cart.filter((item) => item.productId !== id)); notify('Product removed')
  }, [cart, notify, syncCart])

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    if (!configured) { notify('Configure Supabase to update orders.'); return }
    const value = status.toLowerCase()
    const { error } = await createClient().from('orders').update({ status: value }).eq('id', id)
    if (error) notify(error.message); else { setOrders((prev) => prev.map((order) => order.id === id ? { ...order, status } : order)); refresh(); notify(`Order marked as ${status}`) }
  }, [notify, refresh])

  const submitReview = useCallback(async (productId: string, rating: number, title: string, body: string) => {
    if (!configured) { notify('Configure Supabase to submit a review.'); return }
    const item = orders.flatMap((order) => order.items).find((line) => line.productId === productId && line.orderItemId)
    if (!item?.orderItemId) { notify('Reviews are available after purchase and delivery.'); return }
    const { error } = await createClient().from('reviews').insert({ product_id: productId, customer_id: userRef.current?.id, order_item_id: item.orderItemId, rating, title, body })
    if (error) notify(error.message); else { notify('Thank you for your review'); refresh() }
  }, [notify, orders, refresh])

  const uploadArtisanImage = useCallback(async (file: File) => {
    if (!configured) return notify('Configure Supabase to upload artisan images.')
    const id = artisanRef.current
    if (!id) return notify('Create an artisan profile first.')
    try {
      const { url } = await uploadFile(file, 'profile')
      const { error } = await createClient().from('artisan_profiles').update({ avatar_url: url }).eq('id', id)
      if (error) throw error
      setArtisans((prev) => prev.map((artisan) => artisan.id === id ? { ...artisan, image: url } : artisan)); notify('Profile image updated')
    } catch (reason) { notify(reason instanceof Error ? reason.message : 'Image upload failed') }
  }, [notify, uploadFile])

  const value = useMemo<StoreValue>(() => ({
    products, artisans, cart, wishlist, orders, conversations, bulkRequests, toasts, currentUser, currentArtisanId, loading, catalogError,
    getProduct, getArtisan, addToCart, updateCartQuantity, removeFromCart, toggleWishlist, placeOrder,
    startConversation, sendMessage, markConversationRead, submitBulkRequest, respondToBulkRequest,
    addProduct, updateProduct, deleteProduct, updateOrderStatus, submitReview, uploadArtisanImage, notify,
  }), [products, artisans, cart, wishlist, orders, conversations, bulkRequests, toasts, currentUser, currentArtisanId, loading, catalogError, getProduct, getArtisan, addToCart, updateCartQuantity, removeFromCart, toggleWishlist, placeOrder, startConversation, sendMessage, markConversationRead, submitBulkRequest, respondToBulkRequest, addProduct, updateProduct, deleteProduct, updateOrderStatus, submitReview, uploadArtisanImage, notify])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
