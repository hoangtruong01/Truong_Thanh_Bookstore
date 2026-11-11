import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import NotificationDropdown from '../NotificationDropdown.vue'
import { notificationService } from '@/services/notification.service'
import { useAuthStore } from '@/stores/auth'

const push = vi.fn()
const route = reactive({ fullPath: '/' })
const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => route,
}))

// The auth store imports the app router; the real one is not needed here.
vi.mock('@/router', () => ({ default: { push: vi.fn(), currentRoute: { value: { matched: [] } } } }))

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast,
}))

vi.mock('@/services/notification.service', () => ({
  notificationService: {
    getMyNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}))

const svc = vi.mocked(notificationService)

const ITEMS = [
  { _id: 'n1', title: 'Đơn hàng', message: 'Đã giao', type: 'order', isRead: false, createdAt: new Date().toISOString() },
  { _id: 'n2', title: 'Khuyến mãi', message: 'Giảm giá', type: 'promotion', isRead: true, createdAt: new Date().toISOString() },
  { _id: 'n3', title: 'Hạng', message: 'Lên hạng', type: 'tier', isRead: false, createdAt: new Date().toISOString() },
]

// Mirrors the api interceptor: an enveloped body comes back as `{ data: payload }`.
const ok = (payload: unknown) => Promise.resolve({ data: payload } as any)

function login() {
  useAuthStore().user = { _id: 'u1', fullName: 'Khách Test', role: 'CUSTOMER' } as any
}

function mountDropdown() {
  return mount(NotificationDropdown, { attachTo: document.body })
}

async function open(wrapper: ReturnType<typeof mountDropdown>) {
  await wrapper.find('button[title="Thông báo"]').trigger('click')
  await flushPromises()
}

describe('NotificationDropdown.vue (server-side read state)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
    route.fullPath = '/'
    svc.getUnreadCount.mockImplementation(() => ok({ unreadCount: 2 }))
    svc.getMyNotifications.mockImplementation(() =>
      ok({ items: ITEMS.map((i) => ({ ...i })), total: 3, unreadCount: 2 }),
    )
    svc.markAsRead.mockImplementation(() => ok({ success: true }))
    svc.markAllAsRead.mockImplementation(() => ok({ success: true }))
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('shows the unread badge from getUnreadCount on mount', async () => {
    login()
    const wrapper = mountDropdown()
    await flushPromises()

    expect(svc.getUnreadCount).toHaveBeenCalledTimes(1)
    expect(svc.getMyNotifications).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="notification-badge"]').text()).toBe('2')
    wrapper.unmount()
  })

  it('caps the badge at 99+', async () => {
    login()
    svc.getUnreadCount.mockImplementation(() => ok({ unreadCount: 250 }))
    const wrapper = mountDropdown()
    await flushPromises()
    expect(wrapper.find('[data-testid="notification-badge"]').text()).toBe('99+')
    wrapper.unmount()
  })

  it('does not call the API for guests and asks them to log in', async () => {
    const wrapper = mountDropdown()
    await flushPromises()
    await open(wrapper)

    expect(svc.getUnreadCount).not.toHaveBeenCalled()
    expect(svc.getMyNotifications).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="notification-badge"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Vui lòng đăng nhập để xem thông báo.')
    wrapper.unmount()
  })

  it('renders read state from the backend isRead flag', async () => {
    login()
    const wrapper = mountDropdown()
    await flushPromises()
    await open(wrapper)

    const rows = wrapper.findAll('[data-testid="notification-item"]')
    expect(rows).toHaveLength(3)
    expect(rows[0].classes()).toContain('font-semibold')
    expect(rows[1].classes()).not.toContain('font-semibold')
    wrapper.unmount()
  })

  it('marks a single notification as read on the server, then navigates', async () => {
    login()
    const wrapper = mountDropdown()
    await flushPromises()
    await open(wrapper)

    await wrapper.findAll('[data-testid="notification-item"]')[0].trigger('click')
    await flushPromises()

    expect(svc.markAsRead).toHaveBeenCalledWith('n1')
    expect(push).toHaveBeenCalledWith('/my-orders')
    expect(wrapper.find('[data-testid="notification-badge"]').text()).toBe('1')
    expect(localStorage.getItem('customer_read_notification_ids')).toBeNull()
    wrapper.unmount()
  })

  it('does not call markAsRead again for an already read notification', async () => {
    login()
    const wrapper = mountDropdown()
    await flushPromises()
    await open(wrapper)

    await wrapper.findAll('[data-testid="notification-item"]')[1].trigger('click')
    await flushPromises()

    expect(svc.markAsRead).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/products')
    wrapper.unmount()
  })

  it('rolls back the optimistic update when markAsRead fails', async () => {
    login()
    svc.markAsRead.mockRejectedValueOnce(new Error('500'))
    const wrapper = mountDropdown()
    await flushPromises()
    await open(wrapper)

    await wrapper.findAll('[data-testid="notification-item"]')[2].trigger('click')
    await flushPromises()

    expect(wrapper.emitted('open-profile')).toHaveLength(1)
    expect(wrapper.find('[data-testid="notification-badge"]').text()).toBe('2')
    wrapper.unmount()
  })

  it('"Đọc tất cả" calls markAllAsRead and clears the badge', async () => {
    login()
    const wrapper = mountDropdown()
    await flushPromises()
    await open(wrapper)

    const markAll = wrapper.findAll('button').find((b) => b.text() === 'Đọc tất cả')
    await markAll!.trigger('click')
    await flushPromises()

    expect(svc.markAllAsRead).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-testid="notification-badge"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="notification-item"]').every((r) => !r.classes().includes('font-semibold'))).toBe(true)
    wrapper.unmount()
  })

  it('restores unread state and shows a toast when markAllAsRead fails', async () => {
    login()
    svc.markAllAsRead.mockRejectedValueOnce(new Error('500'))
    const wrapper = mountDropdown()
    await flushPromises()
    await open(wrapper)

    const markAll = wrapper.findAll('button').find((b) => b.text() === 'Đọc tất cả')
    await markAll!.trigger('click')
    await flushPromises()

    expect(mockToast.error).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-testid="notification-badge"]').text()).toBe('2')
    expect(wrapper.findAll('[data-testid="notification-item"]')[0].classes()).toContain('font-semibold')
    wrapper.unmount()
  })

  it('refreshes the unread count on realtime socket events', async () => {
    login()
    const wrapper = mountDropdown()
    await flushPromises()
    svc.getUnreadCount.mockImplementation(() => ok({ unreadCount: 5 }))

    window.dispatchEvent(new CustomEvent('notification_received', { detail: { title: 'x' } }))
    await flushPromises()

    expect(svc.getUnreadCount).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[data-testid="notification-badge"]').text()).toBe('5')
    wrapper.unmount()
  })

  it('polls the unread count every 30s and stops after unmount', async () => {
    vi.useFakeTimers()
    try {
      login()
      const wrapper = mountDropdown()
      await flushPromises()
      expect(svc.getUnreadCount).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(30000)
      expect(svc.getUnreadCount).toHaveBeenCalledTimes(2)

      wrapper.unmount()
      await vi.advanceTimersByTimeAsync(60000)
      expect(svc.getUnreadCount).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes on outside click and on route change', async () => {
    login()
    const wrapper = mountDropdown()
    await flushPromises()
    await open(wrapper)
    expect(wrapper.text()).toContain('Thông báo của bạn')

    document.body.click()
    await flushPromises()
    expect(wrapper.text()).not.toContain('Thông báo của bạn')

    await open(wrapper)
    route.fullPath = '/products'
    await flushPromises()
    expect(wrapper.text()).not.toContain('Thông báo của bạn')
    wrapper.unmount()
  })

  it('clears the badge on logout', async () => {
    login()
    const wrapper = mountDropdown()
    await flushPromises()
    expect(wrapper.find('[data-testid="notification-badge"]').exists()).toBe(true)

    useAuthStore().user = null
    await flushPromises()
    expect(wrapper.find('[data-testid="notification-badge"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
