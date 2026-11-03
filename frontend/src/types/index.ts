export interface User {
  _id: string
  fullName: string
  email: string
  phone?: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'CUSTOMER'
  avatar?: string
  status: boolean
  wishlist?: string[]
  loyaltyPoints?: number
  loyaltyTier?: string
  permissions?: string[]
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
  author?: string
  publisher?: string
  publicationYear?: number
  isbn?: string
  price: number
  discountPrice: number
  stock: number
  unit?: string
  productType?: 'BOOK' | 'STATIONERY' | 'OTHER'
  pages?: number
  coverType?: string
  bookSize?: string
  translator?: string
  language?: string
  origin?: string
  color?: string
  material?: string
  packaging?: string
  images: string[]
  rating: number
  sold: number
  status: string
  isFeatured: boolean
  isDeleted: boolean
  isFlashSale?: boolean
  flashSaleExpiry?: string
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

export interface OrderTimelineItem {
  status: string
  note: string
  createdAt: string
}

export interface Order {
  _id: string
  orderCode: string
  customer?: User | string
  items: OrderItem[]
  shippingAddress: string
  phone: string
  note?: string
  paymentMethod: 'COD' | 'BANK_TRANSFER' | 'EWALLET' | 'VNPAY' | 'MOMO'
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'RETURN_REQUESTED' | 'RETURN_APPROVED' | 'RETURNED' | 'COMPLETED' | 'CANCELLED'
  subtotal: number
  shippingFee: number
  discount: number
  loyaltyPointsUsed?: number
  loyaltyDiscount?: number
  total: number
  customerName?: string
  customerEmail?: string
  promotionCode?: string
  shippingProvider?: 'GHN'
  trackingCode?: string
  shippingStatus?: string
  shippingSyncedAt?: string
  returnReason?: string
  returnRequestedAt?: string
  returnApprovedAt?: string
  timeline?: OrderTimelineItem[]
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
  perUserLimit: number
  usedCount: number
  status: boolean
}

// Pricing contract shared by Cart and Checkout. Every money value below is computed by the
// backend (POST /orders/checkout-preview); clients display them and never recompute them.
export interface CheckoutPreviewRequestItem {
  product: string
  quantity: number
}

export interface CheckoutPreviewRequest {
  items: CheckoutPreviewRequestItem[]
  promotionCode?: string
  loyaltyPointsUsed?: number
  paymentMethod?: string
  phone?: string
  customerEmail?: string
  shippingAddress?: string
  landingPageId?: string
}

export interface CheckoutPreviewItem {
  product: string
  name: string
  price: number
  originalPrice: number
  quantity: number
  requestedQuantity?: number
  stock: number
  image?: string
  subtotal: number
}

export interface CheckoutPreviewUnavailableItem {
  product: string
  name?: string
  reason: 'UNAVAILABLE' | 'OUT_OF_STOCK'
  stock?: number
  requestedQuantity?: number
}

export interface CheckoutPreviewLoyalty {
  availablePoints: number
  minRedeemPoints: number
  pointValue: number
  maxRedeemPercent: number
  maxRedeemablePoints: number
  minSubtotalToRedeem: number
  canRedeem: boolean
  requestedPoints: number
  appliedPoints: number
  error: string | null
}

export interface CheckoutPreviewResponse {
  items: CheckoutPreviewItem[]
  unavailableItems?: CheckoutPreviewUnavailableItem[]
  itemCount: number
  subtotal: number
  shippingFee: number
  standardShippingFee?: number
  freeShippingThreshold: number
  isEligibleForFreeShipping: boolean
  amountNeededForFreeShipping: number
  freeShippingProgress?: number
  discount: number
  appliedPromotion: { code: string; discount: number } | null
  promotionError?: string | null
  loyaltyDiscount: number
  loyalty?: CheckoutPreviewLoyalty | null
  total: number
  warnings: string[]
  isValidForCheckout: boolean
}

export interface PricingPolicy {
  freeShippingThreshold: number
  shippingFee: number
  loyalty: {
    minRedeemPoints: number
    pointValue: number
    maxRedeemPercent: number
  }
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

export interface InventoryTransaction {
  _id: string
  product: Product | string
  type: 'IMPORT' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE' | 'OPENING_BALANCE'
  quantity: number
  change: number
  stockBefore: number
  stockAfter: number
  note?: string
  reference?: string
  createdBy?: { _id: string; fullName: string } | string
  createdAt: string
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

export interface Address {
  _id: string
  user?: string
  label: string
  recipientName: string
  phone: string
  province: string
  district: string
  ward: string
  detail: string
  isDefault: boolean
  isDeleted?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateAddressPayload {
  label: string
  recipientName: string
  phone: string
  province: string
  district: string
  ward: string
  detail: string
  isDefault?: boolean
}

export interface UpdateAddressPayload {
  label?: string
  recipientName?: string
  phone?: string
  province?: string
  district?: string
  ward?: string
  detail?: string
  isDefault?: boolean
}

