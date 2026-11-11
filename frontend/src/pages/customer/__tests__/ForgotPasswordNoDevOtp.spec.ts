import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ForgotPassword from '../ForgotPassword.vue'
import { authService } from '@/services/auth.service'

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/composables/useSeoMeta', () => ({
  useSeoMeta: vi.fn(),
}))

vi.mock('@/services/auth.service', () => ({
  authService: {
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}))

describe('ForgotPassword (SEC-029)', () => {
  it('never renders an OTP returned by the API, even in dev builds', async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue({
      data: { success: true, otp: '654321', data: { otp: '654321' } },
    } as any)

    const wrapper = mount(ForgotPassword, {
      global: { stubs: { 'router-link': true } },
    })
    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(authService.forgotPassword).toHaveBeenCalledWith('user@example.com')
    // Đã sang bước 2 (nhập OTP) nhưng không hiển thị OTP từ API
    expect(wrapper.text()).toContain('Mã OTP đã được gửi')
    expect(wrapper.text()).not.toContain('654321')
    expect(wrapper.text()).not.toContain('Development')
  })
})
