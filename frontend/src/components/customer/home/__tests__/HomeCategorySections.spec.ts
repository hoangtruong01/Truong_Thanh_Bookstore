import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeCategoryNav from '../HomeCategoryNav.vue'
import FeaturedCategories from '../FeaturedCategories.vue'

const RouterLinkStub = {
  props: ['to'],
  template: '<a class="rl" :href="to"><slot /></a>',
}

const parents = [
  { _id: 'c-sgk', slug: 'sach-giao-khoa', name: 'Sách giáo khoa' },
  { _id: 'c-gift', slug: 'do-luu-niem', name: 'Đồ lưu niệm' },
] as any[]

const global = { stubs: { 'router-link': RouterLinkStub } }

describe('HomeCategoryNav', () => {
  it('shows six skeleton pills plus the hot-deals pill while loading', () => {
    const wrapper = mount(HomeCategoryNav, { props: { categories: [], loading: true }, global })
    expect(wrapper.findAll('.animate-pulse')).toHaveLength(6)
    expect(wrapper.findAll('a.rl').map((a) => a.attributes('href'))).toEqual(['/products?discounted=true'])
  })

  it('renders the seven category pills before the hot-deals pill', () => {
    const wrapper = mount(HomeCategoryNav, { props: { categories: parents, loading: false }, global })
    const links = wrapper.findAll('a.rl')
    expect(links).toHaveLength(8)
    expect(links[0].text()).toContain('Sách giáo khoa')
    expect(links[0].attributes('href')).toBe('/products?category=c-sgk')
    expect(links[2].attributes('href')).toBe('/products?category=c-gift&q=bút')
    expect(links[3].attributes('href')).toBe('/products')
    expect(links[7].text()).toContain('Ưu đãi hot')
  })
})

describe('FeaturedCategories', () => {
  it('shows seven skeleton cards while loading', () => {
    const wrapper = mount(FeaturedCategories, { props: { categories: [], loading: true }, global })
    expect(wrapper.findAll('.animate-pulse')).toHaveLength(7)
    expect(wrapper.find('.featured-category-card').exists()).toBe(false)
  })

  // The image-set() background value itself is covered in homeHelpers.spec (happy-dom drops it from inline styles).
  it('renders seven linked cards with a background layer', () => {
    const wrapper = mount(FeaturedCategories, { props: { categories: parents, loading: false }, global })
    const cards = wrapper.findAll('.featured-category-card')
    expect(cards).toHaveLength(7)
    expect(cards[0].text()).toContain('Sách giáo khoa')
    expect(cards[0].text()).toContain('Đầy đủ cấp 1, 2, 3')
    expect(cards[0].attributes('href')).toBe('/products?category=c-sgk')
    expect(cards[0].find('.bg-cover').exists()).toBe(true)
  })

  it('renders nothing but the header when categories failed to load', () => {
    const wrapper = mount(FeaturedCategories, { props: { categories: [], loading: false }, global })
    expect(wrapper.text()).toContain('Danh mục nổi bật')
    expect(wrapper.find('.featured-category-card').exists()).toBe(false)
  })
})
