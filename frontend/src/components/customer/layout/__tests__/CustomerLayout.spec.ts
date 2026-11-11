import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { ref } from 'vue'
import CustomerLayout from '@/layouts/CustomerLayout.vue'
import SiteHeader from '../SiteHeader.vue'
import SiteFooter from '../SiteFooter.vue'
import ProfileModal from '@/components/ProfileModal.vue'
import { categoryService } from '@/services/category.service'

const locale = ref('vi')

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ locale }),
}))

vi.mock('@/services/category.service', () => ({
  categoryService: { getAll: vi.fn() },
}))

// Child components are shallow-stubbed; mock their heavy imports so the module graph stays small.
vi.mock('@/components/ProfileModal.vue', () => ({ default: { name: 'ProfileModal', props: ['isOpen'], template: '<div />' } }))
vi.mock('@/components/ChatWidget.vue', () => ({ default: { name: 'ChatWidget', template: '<div />' } }))
vi.mock('@/components/EntryAdPopup.vue', () => ({ default: { name: 'EntryAdPopup', template: '<div />' } }))
vi.mock('../SiteHeader.vue', () => ({
  default: { name: 'SiteHeader', props: ['categories', 'isDarkMode', 'currentLocale'], template: '<div />' },
}))
vi.mock('../SiteFooter.vue', () => ({ default: { name: 'SiteFooter', template: '<div />' } }))

const CATEGORIES = [{ _id: 'c1', name: 'Bút', slug: 'but', parentId: null }]

function mountLayout() {
  return shallowMount(CustomerLayout, { global: { stubs: { 'router-view': true } } })
}

describe('CustomerLayout.vue (composition)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    locale.value = 'vi'
    document.documentElement.classList.remove('dark')
    vi.mocked(categoryService.getAll).mockResolvedValue({ data: CATEGORIES } as any)
  })

  it('renders exactly one header and one footer and passes the loaded categories down', async () => {
    const wrapper = mountLayout()
    await flushPromises()

    expect(wrapper.findAllComponents(SiteHeader)).toHaveLength(1)
    expect(wrapper.findAllComponents(SiteFooter)).toHaveLength(1)
    expect(categoryService.getAll).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent(SiteHeader).props('categories')).toEqual(CATEGORIES)
  })

  it('falls back to an empty category list when the request fails', async () => {
    vi.mocked(categoryService.getAll).mockRejectedValueOnce(new Error('down'))
    const wrapper = mountLayout()
    await flushPromises()
    expect(wrapper.findComponent(SiteHeader).props('categories')).toEqual([])
  })

  it('opens the profile modal when the header asks for it', async () => {
    const wrapper = mountLayout()
    await flushPromises()
    expect(wrapper.findComponent(ProfileModal).props('isOpen')).toBe(false)

    wrapper.findComponent(SiteHeader).vm.$emit('open-profile')
    await flushPromises()
    expect(wrapper.findComponent(ProfileModal).props('isOpen')).toBe(true)
  })

  it('toggles dark mode and persists it', async () => {
    const wrapper = mountLayout()
    await flushPromises()

    wrapper.findComponent(SiteHeader).vm.$emit('toggle-dark-mode')
    await flushPromises()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(wrapper.findComponent(SiteHeader).props('isDarkMode')).toBe(true)
  })

  it('changes locale and syncs theme from other tabs', async () => {
    const wrapper = mountLayout()
    await flushPromises()

    wrapper.findComponent(SiteHeader).vm.$emit('change-locale', 'en')
    await flushPromises()
    expect(locale.value).toBe('en')
    expect(localStorage.getItem('lang')).toBe('en')
    expect(document.documentElement.getAttribute('lang')).toBe('en')

    window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'dark' }))
    await flushPromises()
    expect(wrapper.findComponent(SiteHeader).props('isDarkMode')).toBe(true)
    wrapper.unmount()
  })
})
