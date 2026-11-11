import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FlashSaleCard from '../FlashSaleCard.vue'

const push = vi.fn()
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push }),
}))

const baseProduct = {
  _id: 'p1',
  name: 'Bút bi Thiên Long',
  slug: 'but-bi-thien-long',
  price: 100000,
  discountPrice: 80000,
  stock: 70,
  images: ['https://cdn.example.com/p1.webp'],
  rating: 4.5,
  sold: 30,
} as any

function mountCard(product: any = baseProduct, hot = false) {
  return mount(FlashSaleCard, { props: { product, hot } })
}

describe('FlashSaleCard', () => {
  beforeEach(() => {
    push.mockClear()
  })

  describe('price (BUG-020)', () => {
    it('shows the discounted price and strikes the higher list price', () => {
      const wrapper = mountCard()
      const struck = wrapper.find('.line-through')
      expect(struck.exists()).toBe(true)
      expect(struck.text()).toContain('100.000')
      expect(wrapper.find('.text-\\[\\#dc2626\\]').text()).toContain('80.000')
    })

    it('does not strike anything when there is no discount price', () => {
      const wrapper = mountCard({ ...baseProduct, discountPrice: 0 })
      expect(wrapper.find('.line-through').exists()).toBe(false)
      expect(wrapper.text()).toContain('100.000')
    })

    it('does not strike the list price when the discount price is not lower', () => {
      const equal = mountCard({ ...baseProduct, discountPrice: 100000 })
      expect(equal.find('.line-through').exists()).toBe(false)
      const higher = mountCard({ ...baseProduct, discountPrice: 120000 })
      expect(higher.find('.line-through').exists()).toBe(false)
    })

    it('ignores a negative discount price and shows the list price unstruck', () => {
      const wrapper = mountCard({ ...baseProduct, discountPrice: -5000 })
      expect(wrapper.find('.line-through').exists()).toBe(false)
      expect(wrapper.text()).toContain('100.000')
      expect(wrapper.text()).not.toContain('-5.000')
    })
  })

  describe('sold progress bar', () => {
    it('renders the real sold share', () => {
      const wrapper = mountCard()
      const bar = wrapper.find('[data-testid="sold-progress"]')
      expect(bar.exists()).toBe(true)
      expect(bar.text()).toContain('30%')
      expect(bar.find('[style]').attributes('style')).toContain('width: 30%')
    })

    it('is hidden when sold/stock data is missing instead of faking 30%', () => {
      const wrapper = mountCard({ ...baseProduct, sold: undefined, stock: undefined })
      expect(wrapper.find('[data-testid="sold-progress"]').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('30%')
    })

    it('is hidden when both counts are zero', () => {
      const wrapper = mountCard({ ...baseProduct, sold: 0, stock: 0 })
      expect(wrapper.find('[data-testid="sold-progress"]').exists()).toBe(false)
    })
  })

  it('shows the discount badge and the HOT tag only when asked', () => {
    expect(mountCard(baseProduct, true).text()).toContain('-20%')
    expect(mountCard(baseProduct, true).text()).toContain('🔥 HOT')
    expect(mountCard(baseProduct, false).text()).not.toContain('🔥 HOT')
  })

  it('renders the image lazily with the product name as alt text', () => {
    const wrapper = mountCard()
    const main = wrapper.find(`img[alt="${baseProduct.name}"]`)
    expect(main.exists()).toBe(true)
    expect(main.attributes('loading')).toBe('lazy')
    const blurred = wrapper.find('img[aria-hidden="true"]')
    expect(blurred.attributes('alt')).toBe('')
  })

  it('falls back to the shared placeholder when there is no image or it fails to load', async () => {
    const noImage = mountCard({ ...baseProduct, images: [] })
    expect(noImage.find('img').exists()).toBe(false)
    expect(noImage.find('.from-red-400.to-rose-500').exists()).toBe(true)

    const broken = mountCard()
    await broken.find(`img[alt="${baseProduct.name}"]`).trigger('error')
    expect(broken.find('img').exists()).toBe(false)
    expect(broken.find('.from-red-400.to-rose-500').exists()).toBe(true)
  })

  it('navigates to the product by slug, falling back to the id', async () => {
    await mountCard().trigger('click')
    expect(push).toHaveBeenLastCalledWith('/products/but-bi-thien-long')
    await mountCard({ ...baseProduct, slug: '' }).trigger('click')
    expect(push).toHaveBeenLastCalledWith('/products/p1')
  })

  it('emits add-to-cart from the button without navigating', async () => {
    const wrapper = mountCard()
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('add-to-cart')?.[0]).toEqual([baseProduct])
    expect(push).not.toHaveBeenCalled()
  })
})
