export type CategoryId = 'phanek' | 'innaphi' | 'shawls' | 'bamboo' | 'pottery' | 'accessories'

export type Category = {
  id: CategoryId
  name: string
  description: string
  image: string
}

export type Artisan = {
  id: string
  slug: string
  name: string
  location: string
  district: string
  craft: string
  specialization: string[]
  experienceYears: number
  bio: string
  story: string
  image: string
  rating: number
  languages: string[]
  phone: string
  email: string
  verified: boolean
  cooperative?: string
  joined: string
}

export type Product = {
  id: string
  slug: string
  name: string
  category: CategoryId
  price: number
  originalPrice?: number
  image: string
  description: string
  artisanId: string
  rating: number
  reviews: number
  stock: number
  material: string
  dimensions: string
  care: string
  featured?: boolean
  customizable: boolean
  bulkAvailable: boolean
  minBulkQty?: number
}

export type CartItem = { productId: string; quantity: number }

export type OrderStatus = 'Pending' | 'Paid' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded'

export type Order = {
  id: string
  date: string
  customerName: string
  items: { productId: string; quantity: number; price: number; orderItemId?: string; artisanId?: string; productName?: string; productImageUrl?: string }[]
  total: number
  status: OrderStatus
  city: string
}

export type MessageKind = 'text' | 'offer'

export type Message = {
  id: string
  from: 'customer' | 'artisan'
  text: string
  kind: MessageKind
  offerAmount?: number
  time: string
}

export type Conversation = {
  id: string
  artisanId: string
  customerName: string
  productId?: string
  messages: Message[]
  unread: boolean
}

export type BulkRequest = {
  id: string
  name: string
  business: string
  email: string
  phone: string
  category: CategoryId
  quantity: number
  budget: number
  deadline: string
  customization: string
  artisanId?: string
  status: 'Submitted' | 'Quoted' | 'Accepted' | 'Declined'
  date: string
  productId?: string
  responseAmount?: number
  responseNote?: string
}
