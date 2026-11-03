import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import DealHot from '../DealHot.vue'
import { productService } from '@/services/product.service'

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/services/product.service', () => ({
  productService: {
    getAll: vi.fn(),
  },
}))

vi.mock('@/stores/cart', () => ({
  useCartStore: () => ({ addToCart: vi.fn() }),
}))

vi.mock('@/composables/useSeoMeta', () => ({
  useSeoMeta: vi.fn(),
}))

const ProductCardStub = {
  name: 'ProductCard',
  props: ['product'],
  template: '<div class="product-card-stub">{{ product.name }}</div>',
}

function mountDealHot() {
  return mount(DealHot, {
    global: {
      stubs: { ProductCard: ProductCardStub, 'router-link': true },
    },
  })
}

describe('DealHot.vue product list response shape', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders deals when api.ts returns the unwrapped envelope (res.data is the array)', async () => {
    // Real shape: backend paginated envelope { success, data: [...], meta } is returned as-is by api.ts
    vi.mocked(productService.getAll).mockResolvedValue({
      success: true,
      data: [
        { _id: 'p1', name: 'Bút bi giảm giá' },
        { _id: 'p2', name: 'Vở kẻ ngang giảm giá' },
      ],
      meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
    } as any)

    const wrapper = mountDealHot()
    await flushPromises()

    expect(productService.getAll).toHaveBeenCalledWith({ discounted: true, limit: 100 })
    const cards = wrapper.findAll('.product-card-stub')
    expect(cards).toHaveLength(2)
    expect(wrapper.text()).toContain('Bút bi giảm giá')
    expect(wrapper.text()).toContain('Vở kẻ ngang giảm giá')
    wrapper.unmount()
  })

  it('still supports the nested { data: { data: [...] } } shape', async () => {
    vi.mocked(productService.getAll).mockResolvedValue({
      data: { data: [{ _id: 'p3', name: 'Thước kẻ giảm giá' }], total: 1 },
    } as any)

    const wrapper = mountDealHot()
    await flushPromises()

    expect(wrapper.findAll('.product-card-stub')).toHaveLength(1)
    expect(wrapper.text()).toContain('Thước kẻ giảm giá')
    wrapper.unmount()
  })

  it('shows the empty state when the list is empty', async () => {
    vi.mocked(productService.getAll).mockResolvedValue({ success: true, data: [], meta: null } as any)

    const wrapper = mountDealHot()
    await flushPromises()

    expect(wrapper.findAll('.product-card-stub')).toHaveLength(0)
    wrapper.unmount()
  })
})
