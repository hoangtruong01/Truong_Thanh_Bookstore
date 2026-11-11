import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterSidebar from '../FilterSidebar.vue'
import type { Category } from '@/types'

function cat(partial: Partial<Category> & { _id: string; name: string }): Category {
  return { slug: partial._id, status: true, createdAt: '', updatedAt: '', ...partial } as Category
}

// r1 > c1 > g1 (parent given as populated object and as raw id), r2 has grade options
const categories: Category[] = [
  cat({ _id: 'r1', name: 'Sách giáo khoa', parentId: null }),
  cat({ _id: 'c1', name: 'Tiểu học', parentId: { _id: 'r1' } as any }),
  cat({ _id: 'g1', name: 'Lớp 1 trọn bộ', parentId: 'c1' }),
  cat({ _id: 'r2', name: 'Sách tham khảo', optionsLabel: 'Chọn lớp', optionsType: 'grid', options: ['Lớp 1', 'Lớp 2'] }),
]

function mountSidebar(props: Record<string, unknown> = {}) {
  return mount(FilterSidebar, {
    props: {
      categories,
      selectedCategory: '',
      selectedProductType: '',
      selectedSubOption: '',
      ...props,
    },
  })
}

function buttonByText(wrapper: ReturnType<typeof mountSidebar>, text: string) {
  const btn = wrapper.findAll('button').find((b) => b.text().includes(text))
  if (!btn) throw new Error(`button "${text}" not found`)
  return btn
}

describe('FilterSidebar category tree', () => {
  it('shows only root categories until a branch is expanded', async () => {
    const wrapper = mountSidebar()
    expect(wrapper.text()).toContain('Sách giáo khoa')
    expect(wrapper.text()).toContain('Sách tham khảo')
    expect(wrapper.text()).not.toContain('Tiểu học')

    // r1 has children -> toggle button; r2 has none
    const toggle = wrapper.find('button[title="Mở rộng"]')
    expect(wrapper.findAll('button[title="Mở rộng"]')).toHaveLength(1)
    await toggle.trigger('click')

    expect(wrapper.text()).toContain('↳ Tiểu học')
    expect(wrapper.find('button[title="Thu gọn"]').exists()).toBe(true)
    // the grandchild level stays closed until its own branch is opened
    expect(wrapper.text()).not.toContain('Lớp 1 trọn bộ')
  })

  it('opens every ancestor branch of the selected category (cycle-safe utils/category walk)', () => {
    const wrapper = mountSidebar({ selectedCategory: 'g1' })
    expect(wrapper.text()).toContain('↳ Tiểu học')
    expect(wrapper.text()).toContain('• Lớp 1 trọn bộ')
    const selected = buttonByText(wrapper, 'Lớp 1 trọn bộ')
    expect(selected.classes()).toContain('text-[#dc2626]')
  })

  it('emits select-category for a category and "" for "Tất cả sản phẩm"', async () => {
    const wrapper = mountSidebar({ selectedCategory: 'r1' })
    await buttonByText(wrapper, 'Sách tham khảo').trigger('click')
    await buttonByText(wrapper, 'Tất cả sản phẩm').trigger('click')
    expect(wrapper.emitted('select-category')).toEqual([['r2'], ['']])
  })

  it('emits select-product-type', async () => {
    const wrapper = mountSidebar()
    await buttonByText(wrapper, 'Văn phòng phẩm').trigger('click')
    expect(wrapper.emitted('select-product-type')).toEqual([['STATIONERY']])
  })
})

describe('FilterSidebar sub-options', () => {
  it('renders the selected category options as a grid and emits toggle-sub-option', async () => {
    const wrapper = mountSidebar({ selectedCategory: 'r2', selectedSubOption: 'Lớp 2' })
    expect(wrapper.text()).toContain('Chọn lớp')
    const grid = wrapper.find('.grid-cols-4')
    expect(grid.findAll('button').map((b) => b.text())).toEqual(['1', '2'])
    await grid.findAll('button')[0].trigger('click')
    expect(wrapper.emitted('toggle-sub-option')).toEqual([['Lớp 1']])
  })

  it('hides the block when the selected category has no options', () => {
    const wrapper = mountSidebar({ selectedCategory: 'r1' })
    expect(wrapper.text()).not.toContain('Chọn lớp')
  })
})

describe('FilterSidebar price / rating / checklists', () => {
  it('a price preset updates min/max BEFORE asking the page to apply', async () => {
    const log: unknown[] = []
    const wrapper = mountSidebar({
      'onUpdate:minPrice': (v: unknown) => log.push(['min', v]),
      'onUpdate:maxPrice': (v: unknown) => log.push(['max', v]),
      onApply: () => log.push('apply'),
    })
    await buttonByText(wrapper, '50k - 100k').trigger('click')
    expect(log).toEqual([['min', 50000], ['max', 100000], 'apply'])
  })

  it('clicking the active preset clears the range; "Trên 200k" keeps max empty', async () => {
    const active = mountSidebar({ minPrice: 200000, maxPrice: null })
    const btn = buttonByText(active, 'Trên 200k')
    expect(btn.classes()).toContain('font-extrabold')
    await btn.trigger('click')
    expect(active.emitted('update:minPrice')).toEqual([[null]])
    expect(active.emitted('apply')).toHaveLength(1)
  })

  it('"Áp dụng giá" only asks the page to apply', async () => {
    const wrapper = mountSidebar()
    await buttonByText(wrapper, 'Áp dụng giá').trigger('click')
    expect(wrapper.emitted('apply')).toHaveLength(1)
    expect(wrapper.emitted('update:minPrice')).toBeUndefined()
  })

  it('toggles the rating filter and applies', async () => {
    const wrapper = mountSidebar({ rating: 4 })
    await buttonByText(wrapper, 'Từ 4 sao').trigger('click')
    await buttonByText(wrapper, 'Từ 5 sao').trigger('click')
    expect(wrapper.emitted('update:rating')).toEqual([[null], [5]])
    expect(wrapper.emitted('apply')).toHaveLength(2)
  })

  it('brand / author / publisher checkboxes emit the new array (page watcher re-fetches)', async () => {
    const wrapper = mountSidebar({ brands: ['Deli'] })
    const thienLong = wrapper.find('input[type="checkbox"][value="Thiên Long"]')
    await thienLong.setValue(true)
    expect(wrapper.emitted('update:brands')).toEqual([[['Deli', 'Thiên Long']]])

    await wrapper.find('input[type="checkbox"][value="NXB Kim Đồng"]').setValue(true)
    expect(wrapper.emitted('update:publishers')).toEqual([[['NXB Kim Đồng']]])
    expect(wrapper.emitted('apply')).toBeUndefined()
  })

  it('stock checkbox updates the model before apply', async () => {
    const log: unknown[] = []
    const wrapper = mountSidebar({
      'onUpdate:onlyInStock': (v: unknown) => log.push(['stock', v]),
      onApply: () => log.push('apply'),
    })
    const stock = wrapper.findAll('input[type="checkbox"]').find((i) => i.element.parentElement?.textContent?.includes('còn hàng'))!
    await stock.setValue(true)
    expect(log).toEqual([['stock', true], 'apply'])
  })
})
