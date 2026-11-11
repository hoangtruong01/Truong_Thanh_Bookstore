import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { reactive } from 'vue'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ProductList from '../ProductList.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'

const route = reactive<{ query: Record<string, any> }>({ query: {} })
const push = vi.fn()

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => route,
  useRouter: () => ({ push }),
}))

vi.mock('vue-toastification', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}))

vi.mock('@/composables/useSeoMeta', () => ({
  useSeoMeta: vi.fn(),
  INDEX_ROBOTS: 'index, follow',
  NOINDEX_ROBOTS: 'noindex, follow',
}))

vi.mock('@/services/product.service', () => ({
  productService: { getAll: vi.fn() },
}))

vi.mock('@/services/category.service', () => ({
  categoryService: { getAll: vi.fn() },
}))

const categories = [
  { _id: 'r1', name: 'Sách giáo khoa', slug: 'sach-giao-khoa', parentId: null, description: 'Mô tả SGK' },
  { _id: 'c1', name: 'Tiểu học', slug: 'tieu-hoc', parentId: { _id: 'r1' } },
]

enableAutoUnmount(afterEach)

function lastParams(): any {
  const calls = vi.mocked(productService.getAll).mock.calls
  return calls[calls.length - 1]?.[0]
}

function mountPage() {
  return mount(ProductList, {
    global: {
      stubs: {
        ProductCard: true,
        SkeletonLoader: true,
        EmptyState: true,
        Breadcrumb: true,
      },
    },
  })
}

describe('ProductList page wiring after the FilterSidebar / ActiveFilterChips split', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    route.query = {}
    vi.mocked(productService.getAll).mockResolvedValue({ data: [], meta: { total: 0, totalPages: 1 } } as any)
    vi.mocked(categoryService.getAll).mockResolvedValue({ data: categories } as any)
  })

  it('keeps the SEO <h1> and fetches the first page on mount', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('header h1').text()).toBe('Tất cả sản phẩm')
    expect(lastParams()).toMatchObject({ page: 1, limit: 16, sort: 'newest', status: 'ACTIVE' })
  })

  it('builds heading, description and breadcrumb from the category in the query', async () => {
    route.query = { category: 'c1' }
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('header h1').text()).toBe('Tiểu học')
    expect(wrapper.findComponent(Breadcrumb).props('items')).toEqual([
      { label: 'Trang chủ', to: '/' },
      { label: 'Sản phẩm', to: '/products' },
      { label: 'Sách giáo khoa', to: '/products?category=r1' },
      { label: 'Tiểu học', to: '/products?category=c1' },
    ])
    // Category chip uses the selected category name
    expect(wrapper.text()).toContain('Danh mục: Tiểu học')
    expect(lastParams()).toMatchObject({ category: 'c1' })
  })

  it('a price preset fetches page 1 with the new range in the same tick', async () => {
    const wrapper = mountPage()
    await flushPromises()
    vi.mocked(productService.getAll).mockClear()

    const preset = wrapper.findAll('button').find((b) => b.text() === '50k - 100k')!
    await preset.trigger('click')

    expect(productService.getAll).toHaveBeenCalledTimes(1)
    expect(lastParams()).toMatchObject({ page: 1, minPrice: 50000, maxPrice: 100000 })
    await flushPromises()
    expect(wrapper.text()).toContain('Giá:')
  })

  it('brand checkbox and its chip round-trip through the page state', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('input[type="checkbox"][value="Deli"]').setValue(true)
    await flushPromises()
    expect(lastParams()).toMatchObject({ brand: 'Deli', page: 1 })

    const chip = wrapper.findAll('span').find((s) => s.text().startsWith('Thương hiệu: Deli'))!
    await chip.find('button').trigger('click')
    await flushPromises()
    expect(lastParams().brand).toBeUndefined()
    expect((wrapper.find('input[type="checkbox"][value="Deli"]').element as HTMLInputElement).checked).toBe(false)
  })

  it('selecting a category pushes it into the URL query (query-param sync)', async () => {
    route.query = { q: 'bút' }
    const wrapper = mountPage()
    await flushPromises()

    const btn = wrapper.findAll('button').find((b) => b.text() === 'Sách giáo khoa')!
    await btn.trigger('click')
    expect(push).toHaveBeenCalledWith({ path: '/products', query: { q: 'bút', category: 'r1' } })
  })

  it('stock checkbox fetches with inStock and "Xóa tất cả bộ lọc" resets to /products', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const stock = wrapper.findAll('input[type="checkbox"]').find((i) => i.element.parentElement?.textContent?.includes('còn hàng'))!
    await stock.setValue(true)
    expect(lastParams()).toMatchObject({ inStock: true, page: 1 })

    await flushPromises()
    await wrapper.findAll('button').find((b) => b.text() === 'Xóa tất cả bộ lọc')!.trigger('click')
    expect(push).toHaveBeenLastCalledWith({ path: '/products' })
  })
})
