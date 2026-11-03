import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ProductCard from '../ProductCard.vue'

vi.mock('vue-toastification', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }),
}))

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push: vi.fn() }),
}))

const baseProduct = {
  _id: 'p1',
  name: 'Bút bi Thiên Long',
  slug: 'but-bi-thien-long',
  price: 35000,
  discountPrice: 0,
  stock: 10,
  images: [],
  rating: 0,
  sold: 0,
} as any

function mountCard(product: any) {
  return mount(ProductCard, {
    props: { product },
    global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
  })
}

describe('BUG-020: ProductCard list price strike-through', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('does not strike the price when discountPrice equals price', () => {
    const wrapper = mountCard({ ...baseProduct, discountPrice: 35000 })
    expect(wrapper.findAll('.line-through')).toHaveLength(0)
  })

  it('strikes the list price when there is a real discount', () => {
    const wrapper = mountCard({ ...baseProduct, discountPrice: 30000 })
    const struck = wrapper.findAll('.line-through')
    expect(struck).toHaveLength(1)
    expect(struck[0].text()).toContain('35.000')
  })

  it('shows only the price when there is no discount', () => {
    const wrapper = mountCard(baseProduct)
    expect(wrapper.findAll('.line-through')).toHaveLength(0)
    expect(wrapper.text()).toContain('35.000')
  })
})
