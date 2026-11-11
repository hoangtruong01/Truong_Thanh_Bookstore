import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FlashSaleCarousel from '../FlashSaleCarousel.vue'

const FlashSaleCardStub = {
  name: 'FlashSaleCard',
  props: ['product', 'hot'],
  emits: ['add-to-cart'],
  template: '<div class="card-stub" :data-hot="hot ? 1 : 0" @click="$emit(\'add-to-cart\', product)">{{ product.name }}</div>',
}

const makeProducts = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ _id: `p${i}`, name: `SP ${i}`, price: 1000, discountPrice: 900 })) as any[]

function mountCarousel(props: { products: any[]; loading: boolean }) {
  return mount(FlashSaleCarousel, {
    props,
    global: { stubs: { FlashSaleCard: FlashSaleCardStub, 'router-link': { template: '<a><slot /></a>' } } },
  })
}

const pageTransform = (wrapper: ReturnType<typeof mountCarousel>) =>
  wrapper.find('.flex.flex-row').attributes('style')

describe('FlashSaleCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 21:30:00 local time -> 2h30m to midnight
    vi.setSystemTime(new Date(2026, 10, 10, 21, 30, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts down to local midnight and ticks every second', async () => {
    const wrapper = mountCarousel({ products: [], loading: true })
    const digits = () => wrapper.findAll('.font-mono').map((d) => d.text())
    expect(digits()).toEqual(['02', '30', '00'])
    await vi.advanceTimersByTimeAsync(1000)
    expect(digits()).toEqual(['02', '29', '59'])
    wrapper.unmount()
  })

  it('shows the skeleton while loading', () => {
    const wrapper = mountCarousel({ products: [], loading: true })
    expect(wrapper.findAll('.animate-pulse')).toHaveLength(5)
    expect(wrapper.find('.card-stub').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders pages of five with a HOT tag on each first card, plus dots', () => {
    const wrapper = mountCarousel({ products: makeProducts(7), loading: false })
    const cards = wrapper.findAll('.card-stub')
    expect(cards).toHaveLength(10)
    expect(cards.filter((c) => c.attributes('data-hot') === '1')).toHaveLength(2)
    expect(wrapper.findAll('[aria-label^="Trang "]')).toHaveLength(2)
    wrapper.unmount()
  })

  it('autoplays every 5s and lets the user jump with arrows and dots', async () => {
    const wrapper = mountCarousel({ products: makeProducts(12), loading: false })
    expect(pageTransform(wrapper)).toContain('translate3d(-0%')
    await vi.advanceTimersByTimeAsync(5000)
    expect(pageTransform(wrapper)).toContain('translate3d(-100%')

    await wrapper.find('[aria-label="Previous page"]').trigger('click')
    expect(pageTransform(wrapper)).toContain('translate3d(-0%')
    await wrapper.find('[aria-label="Previous page"]').trigger('click')
    expect(pageTransform(wrapper)).toContain('translate3d(-200%')
    await wrapper.find('[aria-label="Next page"]').trigger('click')
    expect(pageTransform(wrapper)).toContain('translate3d(-0%')
    await wrapper.find('[aria-label="Trang 2"]').trigger('click')
    expect(pageTransform(wrapper)).toContain('translate3d(-100%')
    wrapper.unmount()
  })

  it('has no arrows, dots or autoplay with a single page', async () => {
    const wrapper = mountCarousel({ products: makeProducts(3), loading: false })
    expect(wrapper.find('[aria-label="Next page"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label^="Trang "]').exists()).toBe(false)
    await vi.advanceTimersByTimeAsync(10000)
    expect(pageTransform(wrapper)).toContain('translate3d(-0%')
    wrapper.unmount()
  })

  it('re-emits add-to-cart from a card', async () => {
    const products = makeProducts(5)
    const wrapper = mountCarousel({ products, loading: false })
    await wrapper.find('.card-stub').trigger('click')
    expect(wrapper.emitted('add-to-cart')?.[0]).toEqual([products[0]])
    wrapper.unmount()
  })

  it('clears its timers on unmount', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    const wrapper = mountCarousel({ products: makeProducts(12), loading: false })
    wrapper.unmount()
    // one for the countdown, one for the autoplay
    expect(clearSpy.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(vi.getTimerCount()).toBe(0)
    clearSpy.mockRestore()
  })
})
