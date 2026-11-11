import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import SearchAutocomplete from '../SearchAutocomplete.vue'
import { productService } from '@/services/product.service'
import { POPULAR_SEARCHES, SEARCH_HISTORY_KEY, normalizeSearchText } from '../searchConfig'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('@/services/product.service', () => ({
  productService: {
    getSuggestions: vi.fn(),
    search: vi.fn(),
  },
}))

const svc = vi.mocked(productService)

const PRODUCTS = [
  { _id: 'p1', slug: 'but-bi-thien-long', name: 'Bút bi Thiên Long', images: ['https://img/p1.jpg'], price: 10000, discountPrice: 8000, rating: 4.5, sold: 12 },
  { _id: 'p2', name: 'Sổ tay', images: [], price: 20000, discountPrice: 0 },
]

function mountSearch(variant: 'desktop' | 'mobile' = 'desktop') {
  return mount(SearchAutocomplete, {
    props: { variant },
    global: {
      stubs: { 'router-link': RouterLinkStub },
      mocks: { $t: (key: string) => key },
    },
  })
}

async function typeQuery(wrapper: ReturnType<typeof mountSearch>, value: string) {
  const input = wrapper.find('input')
  await input.trigger('focus')
  await input.setValue(value)
  await vi.advanceTimersByTimeAsync(250)
  await flushPromises()
}

describe('SearchAutocomplete.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorage.clear()
    svc.getSuggestions.mockResolvedValue({
      data: { products: PRODUCTS, categories: [{ _id: 'c1', name: 'Bút viết' }], keywords: ['bút bi xanh'] },
    } as any)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('normalizeSearchText strips Vietnamese diacritics', () => {
    expect(normalizeSearchText('Bút Đỏ Sổ Tay')).toBe('but do so tay')
  })

  it('renders the desktop and mobile variants with their own placeholder and container', () => {
    const desktop = mountSearch('desktop')
    expect(desktop.find('input').attributes('placeholder')).toBe('Tìm bút, sổ tay, giấy A4, kẹp giấy...')
    expect(desktop.classes()).toContain('flex-grow')

    const mobile = mountSearch('mobile')
    expect(mobile.find('input').attributes('placeholder')).toBe('Tìm kiếm sản phẩm...')
    expect(mobile.classes()).toEqual(expect.arrayContaining(['block', 'md:hidden']))
  })

  it('shows popular searches and history when focused with an empty query', async () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['giấy A4']))
    const wrapper = mountSearch()
    await wrapper.find('input').trigger('focus')

    const dropdown = wrapper.find('[data-testid="search-dropdown"]')
    expect(dropdown.exists()).toBe(true)
    POPULAR_SEARCHES.forEach((k) => expect(dropdown.text()).toContain(k))
    expect(dropdown.text()).toContain('giấy A4')
  })

  it('ignores corrupt history in localStorage', async () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, '{not json')
    const wrapper = mountSearch()
    await wrapper.find('input').trigger('focus')
    expect(wrapper.text()).not.toContain('search.history')
  })

  it('debounces the suggestions request (250ms) and renders lazy product images', async () => {
    const wrapper = mountSearch()
    const input = wrapper.find('input')
    await input.trigger('focus')
    await input.setValue('b')
    await input.setValue('bu')
    await input.setValue('but')
    expect(svc.getSuggestions).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(250)
    await flushPromises()

    expect(svc.getSuggestions).toHaveBeenCalledTimes(1)
    expect(svc.getSuggestions).toHaveBeenCalledWith('but', 6)
    const imgs = wrapper.findAll('img')
    expect(imgs).toHaveLength(2)
    imgs.forEach((img) => {
      expect(img.attributes('loading')).toBe('lazy')
      expect(img.attributes('alt')).toBe('Product image')
    })
    expect(wrapper.text()).toContain('Bút bi Thiên Long')
  })

  it('desktop shows API categories and keywords; mobile keeps local suggestions only', async () => {
    const desktop = mountSearch('desktop')
    await typeQuery(desktop, 'bút')
    expect(desktop.text()).toContain('Danh mục liên quan')
    expect(desktop.text()).toContain('bút bi xanh')
    expect(desktop.text()).toContain('Đã bán 12')

    const mobile = mountSearch('mobile')
    await typeQuery(mobile, 'bút')
    expect(mobile.text()).not.toContain('Danh mục liên quan')
    expect(mobile.text()).not.toContain('bút bi xanh')
    expect(mobile.text()).toContain('bút gel')
    expect(mobile.text()).not.toContain('Đã bán')
  })

  it('falls back to productService.search when suggestions fail', async () => {
    svc.getSuggestions.mockRejectedValueOnce(new Error('down'))
    svc.search.mockResolvedValueOnce({ data: PRODUCTS } as any)
    const wrapper = mountSearch()
    await typeQuery(wrapper, 'sổ')

    expect(svc.search).toHaveBeenCalledWith('sổ')
    expect(wrapper.text()).toContain('Sổ tay')
  })

  it('opens a product by slug, falling back to _id', async () => {
    const wrapper = mountSearch()
    await typeQuery(wrapper, 'bút')

    const rows = wrapper.findAll('img').map((img) => img.element.parentElement!)
    rows[0].dispatchEvent(new MouseEvent('mousedown'))
    expect(push).toHaveBeenLastCalledWith('/products/but-bi-thien-long')

    await wrapper.find('input').trigger('focus')
    await flushPromises()
    wrapper.findAll('img')[1].element.parentElement!.dispatchEvent(new MouseEvent('mousedown'))
    expect(push).toHaveBeenLastCalledWith('/products/p2')
  })

  it('submitting navigates to the results page and stores the query (max 8, most recent first)', async () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'kéo']))
    const wrapper = mountSearch()
    await wrapper.find('input').setValue('  kéo  ')
    await wrapper.find('form').trigger('submit')

    expect(push).toHaveBeenCalledWith(`/products?q=${encodeURIComponent('kéo')}`)
    const stored = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)!)
    expect(stored[0]).toBe('kéo')
    expect(stored).toHaveLength(8)
  })

  it('does not navigate for a blank query', async () => {
    const wrapper = mountSearch()
    await wrapper.find('input').setValue('   ')
    await wrapper.find('form').trigger('submit')
    expect(push).not.toHaveBeenCalled()
  })

  it('picks up history written by the other instance on focus', async () => {
    const desktop = mountSearch('desktop')
    const mobile = mountSearch('mobile')

    await desktop.find('input').setValue('thước kẻ')
    await desktop.find('form').trigger('submit')

    await mobile.find('input').trigger('focus')
    expect(mobile.find('[data-testid="search-dropdown"]').text()).toContain('thước kẻ')
  })

  it('clears history and hides the dropdown 200ms after blur', async () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['giấy A4']))
    const wrapper = mountSearch()
    const input = wrapper.find('input')
    await input.trigger('focus')

    const clear = wrapper.findAll('button').find((b) => b.text() === 'Xóa tất cả')!
    await clear.trigger('mousedown')
    expect(localStorage.getItem(SEARCH_HISTORY_KEY)).toBeNull()

    await input.trigger('blur')
    await vi.advanceTimersByTimeAsync(200)
    expect(wrapper.find('[data-testid="search-dropdown"]').exists()).toBe(false)
  })
})
