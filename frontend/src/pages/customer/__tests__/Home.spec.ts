import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Home from '../Home.vue'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import { bannerService } from '@/services/banner.service'

const toastSuccess = vi.fn()
const addToCart = vi.fn()

vi.mock('vue-toastification', () => ({
  useToast: () => ({ success: toastSuccess, error: vi.fn(), info: vi.fn() }),
}))

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/stores/cart', () => ({
  useCartStore: () => ({ addToCart }),
}))

vi.mock('@/composables/useSeoMeta', () => ({ useSeoMeta: vi.fn() }))
vi.mock('@/composables/useStructuredData', () => ({ useOrganizationSchema: vi.fn() }))

vi.mock('@/services/product.service', () => ({
  productService: {
    getAll: vi.fn(),
    getBestSelling: vi.fn(),
    getDiscounted: vi.fn(),
    getNew: vi.fn(),
  },
}))
vi.mock('@/services/category.service', () => ({
  categoryService: { getParents: vi.fn() },
}))
vi.mock('@/services/banner.service', () => ({
  bannerService: { getActive: vi.fn() },
}))

const CategoryProductSectionStub = {
  name: 'CategoryProductSection',
  props: ['title', 'products', 'loading', 'viewAllLink'],
  template: '<section class="cps-stub" :data-title="title" :data-link="viewAllLink">{{ products.length }}</section>',
}

const RouterLinkStub = {
  props: ['to'],
  template: '<a :href="typeof to === \'string\' ? to : \'\'"><slot /></a>',
}

const parents = [
  { _id: 'c-sgk', slug: 'sach-giao-khoa', name: 'Sách giáo khoa' },
  { _id: 'c-combo', slug: 'combo', name: 'Combo' },
]

const deal = {
  _id: 'd1',
  name: 'Vở kẻ ngang',
  slug: 'vo-ke-ngang',
  price: 20000,
  discountPrice: 15000,
  stock: 10,
  sold: 10,
  images: [],
}

function mountHome() {
  return mount(Home, {
    global: { stubs: { CategoryProductSection: CategoryProductSectionStub, 'router-link': RouterLinkStub } },
  })
}

describe('Home page', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(bannerService.getActive).mockResolvedValue({ data: {} } as any)
    vi.mocked(categoryService.getParents).mockResolvedValue({ data: parents } as any)
    vi.mocked(productService.getAll).mockResolvedValue({ data: [deal] } as any)
    vi.mocked(productService.getBestSelling).mockResolvedValue({ data: [deal] } as any)
    vi.mocked(productService.getDiscounted).mockResolvedValue({ data: { data: [deal] } } as any)
    vi.mocked(productService.getNew).mockResolvedValue({ data: [] } as any)
    toastSuccess.mockClear()
    addToCart.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('wires every section with the loaded data', async () => {
    const wrapper = mountHome()
    await flushPromises()

    expect(productService.getDiscounted).toHaveBeenCalledWith(50)
    expect(wrapper.text()).toContain('DEAL SỐC GIỜ VÀNG')
    expect(wrapper.text()).toContain('Vở kẻ ngang')
    expect(wrapper.text()).toContain('Danh mục nổi bật')
    expect(wrapper.text()).toContain('Nâng tầm')
    expect(wrapper.text()).toContain('Khởi nguồn')

    const sections = wrapper.findAll('.cps-stub')
    expect(sections.map((s) => s.attributes('data-title'))).toEqual([
      'Sản phẩm bán chạy nhất',
      'Hàng mới cập bến',
      'Sách Giáo Khoa 2026',
      'Sách Tham Khảo',
      'Đồ Chơi',
      'Truyện Tranh',
      'COMBO',
      'Đồ Lưu Niệm',
    ])
    expect(sections[2].attributes('data-link')).toBe('/products?category=c-sgk')
    expect(sections[3].attributes('data-link')).toBe('/products?category=')
    expect(sections[6].attributes('data-link')).toBe('/products?category=c-combo')
    // only the categories that exist are fetched
    expect(productService.getAll).toHaveBeenCalledTimes(2)

    // nav pills and featured cards share their links
    expect(wrapper.findAll('a[href="/products?category=c-sgk"]').length).toBeGreaterThanOrEqual(2)
    wrapper.unmount()
  })

  it('adds a flash-sale deal to the cart with a toast', async () => {
    const wrapper = mountHome()
    await flushPromises()
    const buyButton = wrapper.findAll('button').find((b) => b.text().includes('MUA NGAY'))
    expect(buyButton).toBeDefined()
    await buyButton!.trigger('click')
    expect(addToCart).toHaveBeenCalledWith(expect.objectContaining({ _id: 'd1' }), 1)
    expect(toastSuccess).toHaveBeenCalledWith('Đã thêm "Vở kẻ ngang" vào giỏ hàng')
    wrapper.unmount()
  })

  it('still renders when every request fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(bannerService.getActive).mockRejectedValue(new Error('x'))
    vi.mocked(categoryService.getParents).mockRejectedValue(new Error('x'))
    vi.mocked(productService.getBestSelling).mockRejectedValue(new Error('x'))
    vi.mocked(productService.getDiscounted).mockRejectedValue(new Error('x'))
    vi.mocked(productService.getNew).mockRejectedValue(new Error('x'))

    const wrapper = mountHome()
    await flushPromises()
    expect(wrapper.text()).toContain('DEAL SỐC GIỜ VÀNG')
    expect(wrapper.text()).toContain('Khởi nguồn')
    expect(wrapper.find('.animate-pulse').exists()).toBe(false)
    consoleSpy.mockRestore()
    wrapper.unmount()
  })
})
