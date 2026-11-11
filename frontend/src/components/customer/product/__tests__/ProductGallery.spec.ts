import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductGallery from '../ProductGallery.vue'

const IMAGES = ['https://img.example.com/a.jpg', 'https://img.example.com/b.jpg']

function mountGallery(images: string[] | null = IMAGES, productName = 'Kính Vạn Hoa') {
  return mount(ProductGallery, { props: { images, productName }, attachTo: document.body })
}

describe('ProductGallery', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('keeps the SEO alt texts and gives only the first slide high priority', () => {
    const wrapper = mountGallery()
    const main = wrapper.findAll('img[fetchpriority]')
    expect(main.map((i) => i.attributes('alt'))).toEqual(['Kính Vạn Hoa - ảnh 1', 'Kính Vạn Hoa - ảnh 2'])
    expect(main[0].attributes('fetchpriority')).toBe('high')
    expect(main[1].attributes('fetchpriority')).toBe('auto')
    expect(wrapper.findAll('img[aria-hidden="true"]').every((i) => i.attributes('alt') === '')).toBe(true)
    expect(wrapper.findAll('button img').map((i) => i.attributes('alt'))).toEqual([
      'Kính Vạn Hoa - ảnh nhỏ 1',
      'Kính Vạn Hoa - ảnh nhỏ 2',
    ])
    wrapper.unmount()
  })

  it('uses the product name as alt for a single image and hides thumbnails', () => {
    const wrapper = mountGallery([IMAGES[0]])
    expect(wrapper.find('img[fetchpriority]').attributes('alt')).toBe('Kính Vạn Hoa')
    expect(wrapper.findAll('button')).toHaveLength(0)
    wrapper.unmount()
  })

  it('shows the keyword placeholder when there are no images', () => {
    const wrapper = mountGallery([], 'Bút chì 2B')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.from-red-400').exists()).toBe(true)
    wrapper.unmount()
  })

  it('swaps a broken image for the placeholder', async () => {
    const wrapper = mountGallery([IMAGES[0]], 'Sổ tay')
    await wrapper.find('img[fetchpriority]').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.from-emerald-400').exists()).toBe(true)
    wrapper.unmount()
  })

  it('autoplays every 3.8s and stops when unmounted', async () => {
    vi.useFakeTimers()
    const wrapper = mountGallery()
    const track = () => wrapper.find('.cursor-zoom-in').attributes('style')
    expect(track()).toContain('translateX(-0%)')
    vi.advanceTimersByTime(3800)
    await wrapper.vm.$nextTick()
    expect(track()).toContain('translateX(-100%)')
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('opens the lightbox on click and navigates with the keyboard', async () => {
    const wrapper = mountGallery()
    await wrapper.find('.cursor-zoom-in').trigger('click')
    expect(wrapper.text()).toContain('Ảnh 1 / 2 • Kính Vạn Hoa')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Ảnh 2 / 2')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Ảnh 1 / 2')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('Ảnh 1 / 2')
    wrapper.unmount()
  })
})
