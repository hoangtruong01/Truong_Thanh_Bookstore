import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import ErrorBoundary from '../ErrorBoundary.vue'
import { DEFAULT_STORE_INFO } from '@/services/store-info.service'

const Boom = defineComponent({
  setup() {
    throw new Error("Cannot access 'J' before initialization")
  },
  render: () => h('div'),
})

async function mountWithFailingChild() {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const wrapper = mount(ErrorBoundary, {
    slots: { default: () => h(Boom) },
    global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
  })
  await flushPromises()
  return wrapper
}

describe('ErrorBoundary.vue (UX-01)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('renders the slot when no error occurs', () => {
    const wrapper = mount(ErrorBoundary, {
      slots: { default: () => h('p', 'nội dung trang') },
    })
    expect(wrapper.text()).toContain('nội dung trang')
    expect(wrapper.text()).not.toContain('Đã xảy ra lỗi')
  })

  it('shows a friendly fallback with a hotline link when a child crashes', async () => {
    const wrapper = await mountWithFailingChild()

    expect(wrapper.text()).toContain('Đã xảy ra lỗi không mong muốn')
    const link = wrapper.find('a[href^="tel:"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe(DEFAULT_STORE_INFO.hotline)
    expect(link.attributes('href')).toBe(
      `tel:${DEFAULT_STORE_INFO.hotline.replace(/[^\d+]/g, '')}`,
    )
  })

  it('never shows the technical error message to customers in production', async () => {
    vi.stubEnv('DEV', false)
    const wrapper = await mountWithFailingChild()

    expect(wrapper.text()).toContain('Đã xảy ra lỗi không mong muốn')
    expect(wrapper.text()).not.toContain('before initialization')
  })
})
