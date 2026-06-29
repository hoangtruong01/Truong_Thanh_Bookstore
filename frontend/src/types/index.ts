export interface User {
  _id: string
  fullName: string
  email: string
  phone?: string
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER'
  avatar?: string
  status: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}

export interface Product {
  _id: string
  name: string
  slug: string
  sku: string
  description?: string
  category: Category | string
  brand?: string
  price: number
  discountPrice: number
  stock: number
  images: string[]
  rating: number
  sold: number
  status: string
  isFeatured: boolean
  isDeleted: boolean
  subOptions?: string[]
  createdAt: string
  updatedAt: string
}

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: Category | string | null
  products?: Product[]
  comboPrice?: number
  status: boolean
  optionsLabel?: string
  optionsType?: 'grid' | 'pills' | ''
  options?: string[]
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  product: Product
  quantity: number
  selected?: boolean
}

export interface OrderItem {
  product: string
  name: string
  price: number
  quantity: number
  image?: string
}

export interface Order {
  _id: string
  orderCode: string
  customer?: User | string
  items: OrderItem[]
  shippingAddress: string
  phone: string
  note?: string
  paymentMethod: 'COD' | 'BANK_TRANSFER' | 'EWALLET'
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED'
  orderStatus: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED'
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  customerName?: string
  customerEmail?: string
  createdAt: string
  updatedAt: string
}

export interface Promotion {
  _id: string
  code: string
  name: string
  description?: string
  discountType: 'PERCENT' | 'FIXED'
  discountValue: number
  minOrderValue: number
  maxDiscount?: number
  startDate: string
  endDate: string
  usageLimit: number
  usedCount: number
  status: boolean
}

export interface Inventory {
  _id: string
  product: Product | string
  currentStock: number
  minStock: number
  maxStock: number
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  lastUpdated: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  timestamp: string
}

export interface DashboardStats {
  todayRevenue: number
  totalOrders: number
  totalProducts: number
  lowStockCount: number
  newCustomers: number
}

export interface DashboardData {
  stats: DashboardStats
  recentOrders: Order[]
  bestSellingProducts: Product[]
}
