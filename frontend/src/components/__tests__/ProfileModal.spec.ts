import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ProfileModal from '../ProfileModal.vue'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast,
}))

vi.mock('@/services/auth.service', () => ({
  authService: {
    changePassword: vi.fn(),
  },
}))

describe('ProfileModal.vue (BUG-005 & IMP-001 Profile & Change Password)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    const authStore = useAuthStore()
    authStore.user = {
      _id: 'user_01',
      fullName: 'Trần Văn Test',
      email: 'test@truongthanh.vn',
      phone: '0912345678',
      role: 'CUSTOMER',
      loyaltyPoints: 500,
      loyaltyTier: 'SILVER',
    } as any
  })

  it('renders profile tab by default with user information', () => {
    const wrapper = mount(ProfileModal, {
      props: { isOpen: true },
    })

    expect(wrapper.text()).toContain('Thông tin cá nhân')
    expect(wrapper.text()).toContain('Đổi mật khẩu')
    expect(wrapper.text()).toContain('Địa chỉ Email')
    expect((wrapper.find('input[type="email"]').element as HTMLInputElement).value).toBe('test@truongthanh.vn')
  })

  it('switches to Change Password tab and validates password format', async () => {
    const wrapper = mount(ProfileModal, {
      props: { isOpen: true },
    })

    const buttons = wrapper.findAll('button')
    const passwordTabButton = buttons.find((b) => b.text().includes('Đổi mật khẩu'))
    expect(passwordTabButton).toBeDefined()
    await passwordTabButton!.trigger('click')

    expect(wrapper.text()).toContain('Mật khẩu hiện tại')
    expect(wrapper.text()).toContain('Mật khẩu mới')
    expect(wrapper.text()).toContain('Xác nhận mật khẩu mới')

    // Click submit without entering current password
    const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Cập nhật mật khẩu'))
    expect(submitBtn).toBeDefined()
    await submitBtn!.trigger('click')

    expect(mockToast.warning).toHaveBeenCalledWith('Vui lòng nhập mật khẩu hiện tại.')
  })

  it('successfully calls authService.changePassword with valid credentials', async () => {
    vi.mocked(authService.changePassword).mockResolvedValue({} as any)

    const wrapper = mount(ProfileModal, {
      props: { isOpen: true },
    })

    // Switch to password tab
    const passwordTabButton = wrapper.findAll('button').find((b) => b.text().includes('Đổi mật khẩu'))
    await passwordTabButton!.trigger('click')

    const inputs = wrapper.findAll('input[type="password"]')
    expect(inputs).toHaveLength(3)

    await inputs[0].setValue('OldPassword123')
    await inputs[1].setValue('NewSecurePass123')
    await inputs[2].setValue('NewSecurePass123')

    const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Cập nhật mật khẩu'))
    await submitBtn!.trigger('click')
    await flushPromises()

    expect(authService.changePassword).toHaveBeenCalledWith({
      currentPassword: 'OldPassword123',
      newPassword: 'NewSecurePass123',
    })
    expect(mockToast.success).toHaveBeenCalledWith(
      expect.stringContaining('Đổi mật khẩu thành công!'),
    )
  })
})
