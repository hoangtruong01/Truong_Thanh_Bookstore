import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ProductDetail from '../ProductDetail.vue'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import { reviewService } from '@/services/review.service'
import { useCartStore } from '@/stores/cart'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }))
vi.mock('vue-toastification', () => ({ useToast: () => toast }))

const route = vi.hoisted(() => ({ params: { id: 'kinh-van-hoa-tap-1' } as Record<string, string> }))
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => route,
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/services/product.service', () => ({
  productService: {
    getById: vi.fn(),
    getRelated: vi.fn(),
    getAll: vi.fn(),
    getReviews: vi.fn(),
    addReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
    subscribeStockAlert: vi.fn(),
  },
}))
vi.mock('@/services/category.service', () => ({
  categoryService: { getById: vi.fn(), getAll: vi.fn() },
}))
vi.mock('@/services/review.service', () => ({
  reviewService: { getBreakdown: vi.fn() },
}))

const ROOT = { _id: 'c0', name: 'Sách', parentId: null }
const CHILD = { _id: 'c1', name: 'Sách thiếu nhi', parentId: 'c0' }
const PRODUCT = {
  _id: '665f00000000000000000001',
  slug: 'kinh-van-hoa-tap-1',
  name: 'Kính Vạn Hoa - Tập 1',
  sku: 'KVH-01',
  description: 'Mô tả',
  category: CHILD,
  price: 50000,
  discountPrice: 40000,
  stock: 12,
  sold: 3,
  images: ['https://img.example.com/1.jpg'],
  status: 'ACTIVE',
}
const RELATED = { _id: 'r1', slug: 'r-1', name: 'Kính Vạn Hoa - Tập 2', price: 50000, discountPrice: 0, stock: 5, images: [], sold: 0, rating: 0 }

function mountPage() {
  return mount(ProductDetail, {
    global: {
      stubs: {
        'router-link': { props: ['to'], template: '<a :href="String(to)"><slot /></a>' },
      },
    },
  })
}

describe('ProductDetail page', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(productService.getById).mockResolvedValue({ data: PRODUCT } as any)
    vi.mocked(productService.getRelated).mockResolvedValue({ data: [RELATED, PRODUCT] } as any)
    vi.mocked(productService.getReviews).mockResolvedValue({ data: [] } as any)
    vi.mocked(reviewService.getBreakdown).mockResolvedValue({
      data: { averageRating: 0, totalReviews: 0, breakdown: {}, percentages: {} },
    } as any)
    vi.mocked(categoryService.getById).mockResolvedValue({ data: { ...CHILD, products: [] } } as any)
    vi.mocked(categoryService.getAll).mockResolvedValue({ data: [ROOT, CHILD] } as any)
  })

  it('renders the product sections and a single H1', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.find('h1').text()).toBe(PRODUCT.name)
    expect(wrapper.text()).toContain('Mô tả sản phẩm')
    expect(wrapper.text()).toContain('Thông tin chi tiết & Thông số kỹ thuật')
    expect(wrapper.text()).toContain('Chưa có đánh giá')
  })

  it('loads reviews and the rating breakdown by product _id even when the URL uses the slug', async () => {
    mountPage()
    await flushPromises()
    expect(productService.getById).toHaveBeenCalledWith('kinh-van-hoa-tap-1')
    expect(productService.getReviews).toHaveBeenCalledWith(PRODUCT._id)
    expect(reviewService.getBreakdown).toHaveBeenCalledWith(PRODUCT._id)
  })

  it('builds the breadcrumb from the full category path', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const hrefs = wrapper.findAll('nav a').map((a) => a.attributes('href'))
    expect(hrefs).toEqual(expect.arrayContaining(['/products?category=c0', '/products?category=c1']))
    expect(hrefs.indexOf('/products?category=c0')).toBeLessThan(hrefs.indexOf('/products?category=c1'))
  })

  it('lists related products without the current one and adds them to the cart', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('Sản phẩm liên quan & Gợi ý cho bạn')
    const cart = useCartStore()
    const addSpy = vi.spyOn(cart, 'addToCart').mockImplementation(() => {})
    const related = wrapper.findComponent({ name: 'RelatedProducts' })
    expect(related.findAllComponents({ name: 'ProductCard' })).toHaveLength(1)
    related.vm.$emit('add-to-cart', RELATED)
    expect(addSpy).toHaveBeenCalledWith(RELATED, 1)
    expect(toast.success).toHaveBeenCalledWith('Đã thêm "Kính Vạn Hoa - Tập 2" vào giỏ hàng')
  })

  it('shows the not-found state and a toast when the product fails to load', async () => {
    vi.mocked(productService.getById).mockRejectedValue(new Error('404'))
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('Không tìm thấy sản phẩm')
    expect(toast.error).toHaveBeenCalledWith('Lỗi khi tải chi tiết sản phẩm')
    expect(productService.getReviews).not.toHaveBeenCalled()
  })

  it('opens and closes the policy modal', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const row = wrapper.findAll('button').find((b) => b.text().includes('Chính sách khách sỉ'))!
    await row.trigger('click')
    expect(wrapper.text()).toContain('Chính sách ưu đãi khách sỉ')
    const close = wrapper.findAll('button').find((b) => b.text() === 'Đóng')!
    await close.trigger('click')
    expect(wrapper.text()).not.toContain('Chính sách ưu đãi khách sỉ')
  })
})
