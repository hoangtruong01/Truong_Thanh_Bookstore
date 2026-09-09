import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkeletonLoader from '../SkeletonLoader.vue'

describe('SkeletonLoader Component (FE-04 Skeleton Loading)', () => {
  it('renders default lines skeleton', () => {
    const wrapper = mount(SkeletonLoader, {
      props: { count: 4 },
    })
    expect(wrapper.classes()).toContain('shimmer-wrapper')
    const lines = wrapper.findAll('.space-y-2\\.5 > div')
    expect(lines.length).toBe(4)
  })

  it('renders table skeleton with proper row count', () => {
    const wrapper = mount(SkeletonLoader, {
      props: { type: 'table', count: 5 },
    })
    const rows = wrapper.findAll('.space-y-3 > div')
    expect(rows.length).toBe(5)
  })

  it('renders card grid skeleton', () => {
    const wrapper = mount(SkeletonLoader, {
      props: { type: 'card', count: 6 },
    })
    const cards = wrapper.findAll('.grid > div')
    expect(cards.length).toBe(6)
  })

  it('renders product-detail skeleton', () => {
    const wrapper = mount(SkeletonLoader, {
      props: { type: 'product-detail' },
    })
    expect(wrapper.find('.grid-cols-1.md\\:grid-cols-2').exists()).toBe(true)
  })

  it('renders cart skeleton', () => {
    const wrapper = mount(SkeletonLoader, {
      props: { type: 'cart', count: 3 },
    })
    expect(wrapper.find('.grid-cols-1.lg\\:grid-cols-3').exists()).toBe(true)
  })

  it('renders order-list skeleton', () => {
    const wrapper = mount(SkeletonLoader, {
      props: { type: 'order-list', count: 3 },
    })
    const orderCards = wrapper.findAll('.space-y-6 > div')
    expect(orderCards.length).toBe(3)
  })
})
