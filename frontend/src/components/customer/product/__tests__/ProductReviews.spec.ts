import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ProductReviews from '../ProductReviews.vue'
import { productService } from '@/services/product.service'
import { reviewService } from '@/services/review.service'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }))
vi.mock('vue-toastification', () => ({ useToast: () => toast }))

vi.mock('@/services/product.service', () => ({
  productService: {
    getReviews: vi.fn(),
    addReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
  },
}))

vi.mock('@/services/review.service', () => ({
  reviewService: { getBreakdown: vi.fn() },
}))

const REVIEWS = [
  { _id: 'r1', name: 'An', rating: 4, content: 'Hay', createdAt: '2026-01-03T00:00:00.000Z' },
  { _id: 'r2', name: 'Bình', rating: 5, content: 'Rất hay', createdAt: '2026-01-04T00:00:00.000Z' },
]

function mountReviews(productId = 'p1') {
  return mount(ProductReviews, {
    props: { productId },
    global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
  })
}

describe('ProductReviews', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('uses the backend breakdown endpoint for average and per-star counts', async () => {
    vi.mocked(productService.getReviews).mockResolvedValue({ data: REVIEWS } as any)
    vi.mocked(reviewService.getBreakdown).mockResolvedValue({
      data: {
        averageRating: 3.7,
        totalReviews: 3,
        breakdown: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 },
        percentages: { 1: 0, 2: 0, 3: 33, 4: 33, 5: 33 },
      },
    } as any)

    const wrapper = mountReviews()
    await flushPromises()

    expect(productService.getReviews).toHaveBeenCalledWith('p1')
    expect(reviewService.getBreakdown).toHaveBeenCalledWith('p1')
    // Backend values win over a client-side recount of the 2 loaded reviews (which would give 4.5)
    expect(wrapper.find('.rating-stats-panel').text()).toContain('3.7')
    expect(wrapper.find('.rating-stats-panel').text()).toContain('Dựa trên 3 lượt đánh giá')
    expect(wrapper.find('.rating-stats-panel').text()).toContain('1 (33%)')

    const events = wrapper.emitted('summary-change') || []
    expect(events.at(-1)?.[0]).toMatchObject({ averageRating: 3.7, totalReviews: 3 })
  })

  it('shows "Chưa có đánh giá" (not a default rating) when the product has no reviews', async () => {
    vi.mocked(productService.getReviews).mockResolvedValue({ data: [] } as any)
    vi.mocked(reviewService.getBreakdown).mockResolvedValue({
      data: {
        averageRating: 0,
        totalReviews: 0,
        breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    } as any)

    const wrapper = mountReviews()
    await flushPromises()

    const panel = wrapper.find('.rating-stats-panel')
    expect(panel.find('[data-testid="no-rating"]').text()).toBe('Chưa có đánh giá')
    expect(panel.text()).not.toContain('/ 5')
    expect(panel.findAll('svg.text-yellow-500')).toHaveLength(0)
    expect(wrapper.text()).toContain('Chưa có đánh giá nào cho sản phẩm này')
    expect(wrapper.emitted('summary-change')?.at(-1)?.[0]).toMatchObject({ averageRating: 0, totalReviews: 0 })
  })

  it('falls back to the loaded reviews when the breakdown endpoint fails', async () => {
    vi.mocked(productService.getReviews).mockResolvedValue({ data: REVIEWS } as any)
    vi.mocked(reviewService.getBreakdown).mockRejectedValue(new Error('network'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const wrapper = mountReviews()
    await flushPromises()

    expect(wrapper.find('.rating-stats-panel').text()).toContain('4.5')
    expect(wrapper.emitted('summary-change')?.at(-1)?.[0]).toMatchObject({ averageRating: 4.5, totalReviews: 2 })
  })

  it('falls back when the breakdown payload is malformed', async () => {
    vi.mocked(productService.getReviews).mockResolvedValue({ data: REVIEWS } as any)
    vi.mocked(reviewService.getBreakdown).mockResolvedValue({ data: [] } as any)

    const wrapper = mountReviews()
    await flushPromises()

    expect(wrapper.emitted('summary-change')?.at(-1)?.[0]).toMatchObject({ averageRating: 4.5, totalReviews: 2 })
  })

  it('filters the list by star and shows per-star counts in the tabs', async () => {
    vi.mocked(productService.getReviews).mockResolvedValue({ data: REVIEWS } as any)
    vi.mocked(reviewService.getBreakdown).mockResolvedValue({
      data: { averageRating: 4.5, totalReviews: 2, breakdown: { 4: 1, 5: 1 }, percentages: { 4: 50, 5: 50 } },
    } as any)

    const wrapper = mountReviews()
    await flushPromises()

    const fourStarTab = wrapper.findAll('button').find((b) => b.text().replace(/\s+/g, '') === '4★(1)')
    expect(fourStarTab).toBeTruthy()
    await fourStarTab!.trigger('click')
    expect(wrapper.text()).toContain('Hay')
    expect(wrapper.text()).not.toContain('Rất hay')
  })
})
