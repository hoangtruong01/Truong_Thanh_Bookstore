import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ProductPurchasePanel from '../ProductPurchasePanel.vue'
import { useCartStore } from '@/stores/cart'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }))
vi.mock('vue-toastification', () => ({ useToast: () => toast }))

const push = vi.hoisted(() => vi.fn())
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push }),
}))

vi.mock('@/services/product.service', () => ({
  productService: { subscribeStockAlert: vi.fn() },
}))

const baseProduct = {
  _id: 'p1',
  name: 'Bút bi Thiên Long',
  slug: 'but-bi-thien-long',
  sku: 'BB-01',
  price: 35000,
  discountPrice: 0,
  stock: 10,
  unit: 'cây',
  images: [],
  rating: 0,
  sold: 4,
} as any

function mountPanel(product: any = baseProduct, extra: Record<string, unknown> = {}) {
  return mount(ProductPurchasePanel, {
    props: { product, categoryDetail: null, averageRating: 0, reviewCount: 0, ...extra },
  })
}

function priceBlock(wrapper: ReturnType<typeof mountPanel>) {
  return wrapper.find('.bg-slate-50.rounded-2xl.p-6')
}

describe('ProductPurchasePanel price block', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it.each([
    ['no discount', 0],
    ['discountPrice equal to price', 35000],
    ['discountPrice above price', 40000],
  ])('shows only the price, no strike-through or "Tiết kiệm", for %s', (_label, discountPrice) => {
    const wrapper = mountPanel({ ...baseProduct, discountPrice })
    const block = priceBlock(wrapper)
    expect(block.findAll('.line-through')).toHaveLength(0)
    expect(block.text()).not.toContain('Tiết kiệm')
    expect(block.text()).toContain('35.000')
  })

  it('strikes the list price and shows the saving for a real discount', () => {
    const wrapper = mountPanel({ ...baseProduct, discountPrice: 28000 })
    const block = priceBlock(wrapper)
    const struck = block.findAll('.line-through')
    expect(struck).toHaveLength(1)
    expect(struck[0].text()).toContain('35.000')
    expect(block.text()).toContain('Tiết kiệm')
    expect(block.text()).toContain('7.000')
    expect(block.text()).toContain('(-20%)')
  })

  it('shows the rating badge only when there are reviews', () => {
    expect(mountPanel().find('.bg-yellow-50').exists()).toBe(false)
    const wrapper = mountPanel(baseProduct, { averageRating: 4.5, reviewCount: 2 })
    expect(wrapper.find('.bg-yellow-50').text()).toContain('4.5')
  })
})

describe('ProductPurchasePanel cart actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds the chosen quantity to the cart exactly once per click', async () => {
    const wrapper = mountPanel()
    const cart = useCartStore()
    const addSpy = vi.spyOn(cart, 'addToCart').mockImplementation(() => {})

    const plus = wrapper.findAll('button').find((b) => b.text() === '+')!
    await plus.trigger('click')
    await plus.trigger('click')

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('Thêm vào giỏ hàng'))!
    await addBtn.trigger('click')

    expect(addSpy).toHaveBeenCalledTimes(1)
    expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({ _id: 'p1' }), 3)
    expect(toast.success).toHaveBeenCalledTimes(1)
    expect(toast.success).toHaveBeenCalledWith('Đã thêm 3 "Bút bi Thiên Long" vào giỏ hàng')

    // Locked while the spinner shows, unlocked after 500ms
    await addBtn.trigger('click')
    expect(addSpy).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(500)
    await wrapper.vm.$nextTick()
    await addBtn.trigger('click')
    expect(addSpy).toHaveBeenCalledTimes(2)
  })

  it('buy now adds to cart and goes to checkout', async () => {
    const wrapper = mountPanel()
    const cart = useCartStore()
    const addSpy = vi.spyOn(cart, 'addToCart').mockImplementation(() => {})

    const buyBtn = wrapper.findAll('button').find((b) => b.text().includes('Mua ngay'))!
    await buyBtn.trigger('click')

    expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({ _id: 'p1' }), 1)
    expect(push).toHaveBeenCalledWith('/checkout')
  })

  it('disables purchase buttons and shows the stock alert form when out of stock', () => {
    const wrapper = mountPanel({ ...baseProduct, stock: 0 })
    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('Thêm vào giỏ hàng'))!
    expect(addBtn.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Nhận thông báo khi có hàng')
  })

  it('emits open-policy for each policy row', async () => {
    const wrapper = mountPanel()
    const row = wrapper.findAll('button').find((b) => b.text().includes('Chính sách đổi trả'))!
    await row.trigger('click')
    expect(wrapper.emitted('open-policy')?.[0]).toEqual(['return'])
  })
})
