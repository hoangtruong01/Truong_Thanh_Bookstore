import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from '../cart'
import { cartService } from '@/services/cart.service'

vi.mock('@/services/cart.service', () => ({
  cartService: {
    getCart: vi.fn(),
    syncCart: vi.fn(),
    validateCart: vi.fn(),
  },
}))

describe('Cart Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('adds an item to the local cart', () => {
    const store = useCartStore()
    const product = { _id: '123', name: 'Book', price: 100, stock: 5, images: [] } as any

    store.addToCart(product, 2)

    expect(store.items).toHaveLength(1)
    expect(store.items[0].product._id).toBe('123')
    expect(store.items[0].quantity).toBe(2)
    expect(JSON.parse(localStorage.getItem('cart') || '[]')).toHaveLength(1)
  })

  it('syncs a local cart with the authenticated server cart', async () => {
    const store = useCartStore()
    const product = { _id: '123', name: 'Book', price: 100, stock: 5, images: [] } as any
    store.addToCart(product, 1)
    vi.mocked(cartService.syncCart).mockResolvedValueOnce({ data: {} } as any)
    vi.mocked(cartService.getCart).mockResolvedValueOnce({
      data: { items: [{ product, quantity: 2 }] },
    } as any)

    await store.syncWithServer(true)

    expect(cartService.syncCart).toHaveBeenCalledWith([{ productId: '123', quantity: 1 }])
    expect(store.items[0].quantity).toBe(2)
  })

  it('calculates selected-item totals and shipping', () => {
    const store = useCartStore()
    const product1 = { _id: '1', name: 'Book 1', price: 100, discountPrice: 80, stock: 5, images: [] } as any
    const product2 = { _id: '2', name: 'Book 2', price: 200, stock: 5, images: [] } as any

    store.addToCart(product1, 2)
    store.addToCart(product2, 1)

    expect(store.itemsCount).toBe(3)
    expect(store.subtotal).toBe(360)
    expect(store.total).toBe(30360)
  })
})
