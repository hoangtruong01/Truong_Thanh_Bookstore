import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import HeroBannerGrid from '../HeroBannerGrid.vue'

const slides = [
  { _id: 'b1', imageUrl: '/b1.webp', title: 'Banner 1', linkUrl: '/a' },
  { _id: 'b2', imageUrl: '/b2.webp', title: 'Banner 2' },
  { _id: 'b3', imageUrl: '/b3.webp', title: 'Banner 3' },
]

function mountGrid(banners: Record<string, any[]>, loading = false) {
  return mount(HeroBannerGrid, {
    props: { banners, loading },
    global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
  })
}

const activeSlideSrc = (wrapper: ReturnType<typeof mountGrid>) =>
  wrapper.find('.opacity-100 img').attributes('src')

describe('HeroBannerGrid', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the skeleton while banners load', () => {
    const wrapper = mountGrid({}, true)
    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Khởi nguồn')
  })

  it('renders the built-in fallbacks when there are no banners', () => {
    const wrapper = mountGrid({})
    expect(wrapper.text()).toContain('Khởi nguồn')
    expect(wrapper.text()).toContain('Đầy đủ các cấp')
    expect(wrapper.text()).toContain('Ưu đãi sinh viên')
    expect(wrapper.text()).toContain('Miễn phí vận chuyển')
    expect(wrapper.text()).toContain('Sale hết cỡ')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('loads the first slide eagerly with high priority (LCP) and defers the others', () => {
    const wrapper = mountGrid({ main_slider: slides })
    const imgs = wrapper.findAll('img[alt^="Banner"]')
    expect(imgs).toHaveLength(3)
    expect(imgs[0].attributes('fetchpriority')).toBe('high')
    expect(imgs[0].attributes('loading')).toBe('eager')
    expect(imgs[1].attributes('loading')).toBe('lazy')
    expect(imgs[2].attributes('fetchpriority')).toBe('auto')
    expect(wrapper.find('a[href="/a"] img').attributes('alt')).toBe('Banner 1')
  })

  it('autoplays every 4s and supports arrows and dots', async () => {
    const wrapper = mountGrid({ main_slider: slides })
    expect(activeSlideSrc(wrapper)).toBe('/b1.webp')
    await vi.advanceTimersByTimeAsync(4000)
    expect(activeSlideSrc(wrapper)).toBe('/b2.webp')

    const buttons = wrapper.findAll('button')
    // [prev, next, dot1, dot2, dot3]
    await buttons[0].trigger('click')
    expect(activeSlideSrc(wrapper)).toBe('/b1.webp')
    await buttons[0].trigger('click')
    expect(activeSlideSrc(wrapper)).toBe('/b3.webp')
    await buttons[1].trigger('click')
    expect(activeSlideSrc(wrapper)).toBe('/b1.webp')
    await buttons[3].trigger('click')
    expect(activeSlideSrc(wrapper)).toBe('/b2.webp')
    wrapper.unmount()
  })

  it('starts autoplay once banners arrive after mount and stops it on unmount', async () => {
    const wrapper = mountGrid({}, true)
    expect(vi.getTimerCount()).toBe(0)
    await wrapper.setProps({ banners: { main_slider: slides }, loading: false })
    expect(vi.getTimerCount()).toBe(1)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not autoplay or show controls for a single slide', () => {
    const wrapper = mountGrid({ main_slider: slides.slice(0, 1) })
    expect(wrapper.findAll('button')).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('renders sidebar banners and at most four bottom-row banners', () => {
    const bottom = Array.from({ length: 6 }, (_, i) => ({ _id: `r${i}`, imageUrl: `/r${i}.webp`, title: `Row ${i}` }))
    const wrapper = mountGrid({
      sidebar_left: [{ imageUrl: '/l.webp', title: 'Left', linkUrl: '/left' }],
      sidebar_right_top: [{ imageUrl: '/rt.webp', title: 'Right top' }],
      sidebar_right_bottom: [{ imageUrl: '/rb.webp', title: 'Right bottom' }],
      bottom_row: bottom,
    })
    expect(wrapper.find('a[href="/left"] img').attributes('alt')).toBe('Left')
    expect(wrapper.find('img[alt="Right top"]').exists()).toBe(true)
    expect(wrapper.find('img[alt="Right bottom"]').exists()).toBe(true)
    expect(wrapper.findAll('img[alt^="Row"]')).toHaveLength(4)
    expect(wrapper.text()).not.toContain('Ưu đãi sinh viên')
  })
})
