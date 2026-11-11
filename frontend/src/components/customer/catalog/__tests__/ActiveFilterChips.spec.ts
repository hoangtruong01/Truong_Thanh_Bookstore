import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ActiveFilterChips from '../ActiveFilterChips.vue'

const empty = {
  categoryName: '',
  searchQuery: '',
  minPrice: null,
  maxPrice: null,
  brands: [] as string[],
  authors: [] as string[],
  publishers: [] as string[],
  rating: null,
  onlyInStock: false,
  discounted: false,
}

function mountChips(props: Partial<typeof empty> | Record<string, unknown> = {}) {
  return mount(ActiveFilterChips, { props: { ...empty, ...props } })
}

function chip(wrapper: ReturnType<typeof mountChips>, text: string) {
  const span = wrapper.findAll('span').find((s) => s.text().startsWith(text))
  if (!span) throw new Error(`chip "${text}" not found`)
  return span
}

describe('ActiveFilterChips', () => {
  it('renders only the clear-all button when nothing is set', () => {
    const wrapper = mountChips()
    expect(wrapper.findAll('button')).toHaveLength(1)
    expect(wrapper.text()).toContain('Xóa tất cả bộ lọc')
  })

  it.each([
    [{ minPrice: 50000, maxPrice: 100000 }, `Giá: ${(50000).toLocaleString()}đ - ${(100000).toLocaleString()}đ`],
    [{ minPrice: 200000 }, `Giá: Từ ${(200000).toLocaleString()}đ`],
    [{ maxPrice: 50000 }, `Giá: Dưới ${(50000).toLocaleString()}đ`],
  ])('formats the price range %o', (props, expected) => {
    const wrapper = mountChips(props)
    expect(chip(wrapper, 'Giá:').text()).toContain(expected)
  })

  it('hides the price chip for a 0 lower bound only (same as before the split)', () => {
    expect(mountChips({ minPrice: 0, maxPrice: null }).text()).not.toContain('Giá:')
  })

  it('emits the matching clear event for every chip', async () => {
    const wrapper = mountChips({
      categoryName: 'Sách giáo khoa',
      searchQuery: 'bút',
      minPrice: 1000,
      brands: ['Deli'],
      authors: ['Tô Hoài'],
      publishers: ['NXB Trẻ'],
      rating: 4,
      onlyInStock: true,
      discounted: true,
    })

    await chip(wrapper, 'Danh mục: Sách giáo khoa').find('button').trigger('click')
    await chip(wrapper, 'Từ khóa: "bút"').find('button').trigger('click')
    await chip(wrapper, 'Giá:').find('button').trigger('click')
    await chip(wrapper, 'Thương hiệu: Deli').find('button').trigger('click')
    await chip(wrapper, 'Tác giả: Tô Hoài').find('button').trigger('click')
    await chip(wrapper, 'NXB: NXB Trẻ').find('button').trigger('click')
    await chip(wrapper, '⭐ ≥ 4 sao').find('button').trigger('click')
    await chip(wrapper, 'Còn hàng').find('button').trigger('click')
    await chip(wrapper, 'Đang giảm giá').find('button').trigger('click')
    await wrapper.findAll('button').at(-1)!.trigger('click')

    expect(wrapper.emitted('clear-category')).toHaveLength(1)
    expect(wrapper.emitted('clear-search')).toHaveLength(1)
    expect(wrapper.emitted('clear-price')).toHaveLength(1)
    expect(wrapper.emitted('remove-brand')).toEqual([['Deli']])
    expect(wrapper.emitted('remove-author')).toEqual([['Tô Hoài']])
    expect(wrapper.emitted('remove-publisher')).toEqual([['NXB Trẻ']])
    expect(wrapper.emitted('clear-rating')).toHaveLength(1)
    expect(wrapper.emitted('clear-stock')).toHaveLength(1)
    expect(wrapper.emitted('clear-discount')).toHaveLength(1)
    expect(wrapper.emitted('clear-all')).toHaveLength(1)
  })
})
