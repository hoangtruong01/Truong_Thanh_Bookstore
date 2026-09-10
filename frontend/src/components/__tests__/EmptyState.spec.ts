import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '../EmptyState.vue'

describe('EmptyState Component (FE-04 Empty State UX)', () => {
  const mountWithStubs = (options: any = {}) => {
    return mount(EmptyState, {
      ...options,
      global: {
        stubs: ['router-link'],
        ...(options.global || {}),
      },
    })
  }

  it('renders default empty state', () => {
    const wrapper = mountWithStubs()
    expect(wrapper.text()).toContain('Không có dữ liệu')
    expect(wrapper.text()).toContain('📦')
  })

  it('renders custom icon, title, and description', () => {
    const wrapper = mountWithStubs({
      props: {
        icon: '🛒',
        title: 'Giỏ hàng đang trống',
        description: 'Hãy lấp đầy giỏ hàng bằng những sản phẩm văn phòng phẩm chất lượng.',
        actionText: 'Khám phá ngay',
      },
    })
    expect(wrapper.text()).toContain('🛒')
    expect(wrapper.text()).toContain('Giỏ hàng đang trống')
    expect(wrapper.text()).toContain('Hãy lấp đầy giỏ hàng')
    expect(wrapper.text()).toContain('Khám phá ngay')
  })

  it('emits action event when action button is clicked', async () => {
    const wrapper = mountWithStubs({
      props: {
        actionText: 'Bấm vào đây',
      },
    })
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    await button.trigger('click')
    expect(wrapper.emitted('action')).toHaveLength(1)
  })

  it('renders router-link when actionTo prop is provided', () => {
    const wrapper = mountWithStubs({
      props: {
        actionText: 'Mua sắm ngay',
        actionTo: '/products',
      },
    })
    const routerLink = wrapper.find('router-link-stub')
    expect(routerLink.exists()).toBe(true)
    expect(routerLink.attributes('to')).toBe('/products')
  })
})
