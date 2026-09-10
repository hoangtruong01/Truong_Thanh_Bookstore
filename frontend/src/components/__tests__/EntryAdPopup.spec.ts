import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import EntryAdPopup from '../EntryAdPopup.vue'
import { bannerService } from '@/services/banner.service'

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('@/services/banner.service', () => ({
  bannerService: {
    getActivePopup: vi.fn(),
  },
}))

describe('EntryAdPopup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    localStorage.clear()
    mockPush.mockReset()
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  const mountPopup = () => {
    return mount(EntryAdPopup, {
      global: {
        stubs: {
          Teleport: true,
          Transition: true,
        },
      },
    })
  }

  it('renders ad popup when active popup data is returned from API', async () => {
    const mockPopup = {
      _id: 'popup_123',
      title: 'Khuyến mãi Khai trường',
      imageUrl: 'https://example.com/ad.jpg',
      ctaLabel: 'Khám phá ngay',
      linkUrl: '/products?category=sgk',
      frequency: 'EVERY_VISIT',
      closeable: true,
      isActive: true,
    }

    vi.mocked(bannerService.getActivePopup).mockResolvedValue({
      data: mockPopup,
    } as any)

    const wrapper = mountPopup()
    await flushPromises()

    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-label')).toBe('Khuyến mãi Khai trường')

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/ad.jpg')

    expect(wrapper.text()).toContain('Khám phá ngay')
  })

  it('does not render popup when API returns null', async () => {
    vi.mocked(bannerService.getActivePopup).mockResolvedValue({
      data: null,
    } as any)

    const wrapper = mountPopup()
    await flushPromises()

    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.exists()).toBe(false)
  })

  it('does not render when popup is scheduled for the future', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const mockPopup = {
      _id: 'future_popup',
      title: 'Future promo',
      imageUrl: 'https://example.com/future.jpg',
      startAt: futureDate,
      frequency: 'EVERY_VISIT',
      isActive: true,
    }

    vi.mocked(bannerService.getActivePopup).mockResolvedValue({
      data: mockPopup,
    } as any)

    const wrapper = mountPopup()
    await flushPromises()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('does not render when popup is expired', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    const mockPopup = {
      _id: 'expired_popup',
      title: 'Expired promo',
      imageUrl: 'https://example.com/expired.jpg',
      endAt: pastDate,
      frequency: 'EVERY_VISIT',
      isActive: true,
    }

    vi.mocked(bannerService.getActivePopup).mockResolvedValue({
      data: mockPopup,
    } as any)

    const wrapper = mountPopup()
    await flushPromises()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('closes popup when close button is clicked', async () => {
    const mockPopup = {
      _id: 'popup_close_test',
      title: 'Popup test',
      imageUrl: 'https://example.com/ad.jpg',
      closeable: true,
      frequency: 'EVERY_VISIT',
      isActive: true,
    }

    vi.mocked(bannerService.getActivePopup).mockResolvedValue({
      data: mockPopup,
    } as any)

    const wrapper = mountPopup()
    await flushPromises()

    const closeBtn = wrapper.find('button[aria-label="Đóng quảng cáo"]')
    expect(closeBtn.exists()).toBe(true)

    await closeBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('navigates to linkUrl and closes popup when CTA button is clicked', async () => {
    const mockPopup = {
      _id: 'popup_cta_test',
      title: 'Popup CTA test',
      imageUrl: 'https://example.com/ad.jpg',
      linkUrl: '/products?sale=true',
      ctaLabel: 'Xem ngay',
      frequency: 'EVERY_VISIT',
      closeable: true,
      isActive: true,
    }

    vi.mocked(bannerService.getActivePopup).mockResolvedValue({
      data: mockPopup,
    } as any)

    const wrapper = mountPopup()
    await flushPromises()

    const ctaBtn = wrapper.findAll('button').find((b) => b.text().includes('Xem ngay'))
    expect(ctaBtn).toBeDefined()

    await ctaBtn!.trigger('click')
    await flushPromises()

    expect(mockPush).toHaveBeenCalledWith('/products?sale=true')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('honors ONCE_PER_SESSION frequency with sessionStorage', async () => {
    const mockPopup = {
      _id: 'session_popup',
      title: 'Session promo',
      imageUrl: 'https://example.com/ad.jpg',
      frequency: 'ONCE_PER_SESSION',
      updatedAt: '2026-09-10',
      isActive: true,
    }

    vi.mocked(bannerService.getActivePopup).mockResolvedValue({
      data: mockPopup,
    } as any)

    // First visit: should show
    const wrapper = mountPopup()
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

    // Close and mark seen
    const closeBtn = wrapper.find('button[aria-label="Đóng quảng cáo"]')
    await closeBtn.trigger('click')
    await flushPromises()

    expect(sessionStorage.getItem('entry_ad_seen_session_popup_2026-09-10')).toBe('1')

    // Second visit: should NOT show
    const wrapper2 = mountPopup()
    await flushPromises()
    expect(wrapper2.find('[role="dialog"]').exists()).toBe(false)
  })

  it('honors ONCE_PER_DAY frequency with localStorage', async () => {
    const mockPopup = {
      _id: 'daily_popup',
      title: 'Daily promo',
      imageUrl: 'https://example.com/ad.jpg',
      frequency: 'ONCE_PER_DAY',
      isActive: true,
    }

    vi.mocked(bannerService.getActivePopup).mockResolvedValue({
      data: mockPopup,
    } as any)

    const todayStr = new Date().toISOString().slice(0, 10)

    // First visit
    const wrapper = mountPopup()
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

    // Close
    const closeBtn = wrapper.find('button[aria-label="Đóng quảng cáo"]')
    await closeBtn.trigger('click')
    await flushPromises()

    expect(localStorage.getItem(`entry_ad_seen_daily_popup_${todayStr}`)).toBe('1')

    // Later visit today: should NOT show
    const wrapper2 = mountPopup()
    await flushPromises()
    expect(wrapper2.find('[role="dialog"]').exists()).toBe(false)
  })

  it('hides gracefully when ad image fails to load', async () => {
    const mockPopup = {
      _id: 'broken_img_popup',
      title: 'Broken image promo',
      imageUrl: 'https://example.com/non-existent.jpg',
      frequency: 'EVERY_VISIT',
      isActive: true,
    }

    vi.mocked(bannerService.getActivePopup).mockResolvedValue({
      data: mockPopup,
    } as any)

    const wrapper = mountPopup()
    await flushPromises()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

    // Trigger error on image
    const img = wrapper.find('img')
    await img.trigger('error')
    await flushPromises()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('handles API error gracefully without throwing or crashing', async () => {
    vi.mocked(bannerService.getActivePopup).mockRejectedValue(new Error('Network timeout'))

    const wrapper = mountPopup()
    await flushPromises()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('closes on Escape key press when closeable is true', async () => {
    const mockPopup = {
      _id: 'esc_popup',
      title: 'ESC key promo',
      imageUrl: 'https://example.com/ad.jpg',
      closeable: true,
      frequency: 'EVERY_VISIT',
      isActive: true,
    }

    vi.mocked(bannerService.getActivePopup).mockResolvedValue({
      data: mockPopup,
    } as any)

    const wrapper = mountPopup()
    await flushPromises()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })
})
