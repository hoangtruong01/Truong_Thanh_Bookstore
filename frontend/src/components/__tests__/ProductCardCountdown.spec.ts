import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

const HOUR = 60 * 60 * 1000

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

describe('ProductCard flash-sale countdown', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-10T03:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the remaining time and ticks every second', async () => {
    const expiry = new Date(Date.now() + 2 * HOUR + 5_000).toISOString()
    const wrapper = mountCard({ ...baseProduct, isFlashSale: true, flashSaleExpiry: expiry })
    expect(wrapper.text()).toContain('⚡ Còn:')
    expect(wrapper.text()).toContain('02:00:05')

    await vi.advanceTimersByTimeAsync(2_000)
    expect(wrapper.text()).toContain('02:00:03')
    wrapper.unmount()
  })

  it('shows "Hết hạn" once the flash sale has expired', async () => {
    const expiry = new Date(Date.now() + 1_000).toISOString()
    const wrapper = mountCard({ ...baseProduct, isFlashSale: true, flashSaleExpiry: expiry })
    await vi.advanceTimersByTimeAsync(1_000)
    expect(wrapper.text()).toContain('Hết hạn')
    wrapper.unmount()
  })

  it('renders no countdown and starts no interval for a regular product', () => {
    const setSpy = vi.spyOn(globalThis, 'setInterval')
    const wrapper = mountCard({ ...baseProduct, isFlashSale: false, flashSaleExpiry: new Date().toISOString() })
    expect(wrapper.text()).not.toContain('⚡ Còn:')
    expect(setSpy).not.toHaveBeenCalled()
    setSpy.mockRestore()
    wrapper.unmount()
  })

  it('renders no countdown for a flash sale without an expiry', () => {
    const wrapper = mountCard({ ...baseProduct, isFlashSale: true })
    expect(wrapper.text()).toContain('FLASH SALE')
    expect(wrapper.text()).not.toContain('⚡ Còn:')
    wrapper.unmount()
  })

  it('uses the shared placeholder when the product has no image', () => {
    const wrapper = mountCard(baseProduct)
    expect(wrapper.find('.from-red-400.to-rose-500').exists()).toBe(true)
    wrapper.unmount()
  })
})
