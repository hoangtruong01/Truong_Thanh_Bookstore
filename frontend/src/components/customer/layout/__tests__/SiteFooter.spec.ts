import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import SiteFooter from '../SiteFooter.vue'

const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast,
}))

function mountFooter() {
  return mount(SiteFooter, { global: { stubs: { 'router-link': RouterLinkStub } } })
}

describe('SiteFooter.vue', () => {
  beforeEach(() => vi.clearAllMocks())

  it('keeps the store contact details', () => {
    const text = mountFooter().text()
    expect(text).toContain('0982938316')
    expect(text).toContain('giaoductruongthanh@gmail.com')
    expect(text).toContain('Chợ chanh - Nhân Hà, Ninh Bình, Vietnam')
  })

  it('no longer renders a duplicate search box (the header search covers mobile)', () => {
    const wrapper = mountFooter()
    expect(wrapper.findAll('input')).toHaveLength(1)
    expect(wrapper.find('input').attributes('type')).toBe('email')
  })

  it('opens external links safely', () => {
    const external = mountFooter().findAll('a[target="_blank"]')
    expect(external.length).toBeGreaterThan(0)
    external.forEach((a) => expect(a.attributes('rel')).toBe('noopener noreferrer'))
  })

  it('newsletter: success toast and reset for an email, warning for blank input', async () => {
    const wrapper = mountFooter()
    const input = wrapper.find('input[type="email"]')

    await input.setValue('a@b.vn')
    await wrapper.find('form').trigger('submit')
    expect(mockToast.success).toHaveBeenCalledTimes(1)
    expect((input.element as HTMLInputElement).value).toBe('')

    await input.setValue('   ')
    await wrapper.find('form').trigger('submit')
    expect(mockToast.warning).toHaveBeenCalledTimes(1)
  })
})
