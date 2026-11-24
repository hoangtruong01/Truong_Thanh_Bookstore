import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const locale = ref('vi')

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ locale }),
}))

vi.mock('@/services/report.service', () => ({
  reportService: {
    getNotifications: vi.fn().mockResolvedValue({ data: [] }),
  },
}))

vi.mock('@/components/ProfileModal.vue', () => ({
  default: { name: 'ProfileModal', props: ['isOpen'], template: '<div class="profile-modal-mock" v-if="isOpen" />' },
}))

const adminPaths = [
  '/admin/dashboard',
  '/admin/orders',
  '/admin/pos',
  '/admin/customers',
  '/admin/promotions',
  '/admin/products',
  '/admin/combos',
  '/admin/pricing',
  '/admin/inventory',
  '/admin/warehouses',
  '/admin/purchases',
  '/admin/quotations',
  '/admin/stock-audits',
  '/admin/suppliers',
  '/admin/cashbook',
  '/admin/documents',
  '/admin/reports',
  '/admin/marketing/campaigns',
  '/admin/banners',
  '/admin/landing-pages',
  '/admin/reviews',
  '/admin/users',
  '/login',
  '/',
]

describe('AdminLayout Sidebar Redesign', () => {
  let router: any

  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()
    locale.value = 'vi'

    const authStore = useAuthStore()
    authStore.user = {
      id: 'admin1',
      fullName: 'Trương Thành Admin',
      role: 'ADMIN',
      permissions: [
        'POS_ACCESS',
        'MANAGE_ORDERS',
        'MANAGE_CUSTOMERS',
        'MANAGE_PRODUCTS',
        'MANAGE_PRICING',
        'MANAGE_INVENTORY',
        'MANAGE_FINANCE',
        'VIEW_REPORTS',
        'MANAGE_PROMOTIONS',
        'MANAGE_BANNERS',
        'MANAGE_LANDING_PAGES',
      ],
    } as any

    router = createRouter({
      history: createWebHistory(),
      routes: adminPaths.map(path => ({
        path,
        name: path.replace(/\//g, '_') || 'root',
        component: { template: '<div>Dummy Page</div>' },
      })),
    })

    router.push('/admin/dashboard')
    await router.isReady()
  })

  function createWrapper() {
    return mount(AdminLayout, {
      global: {
        plugins: [router],
        stubs: {
          'router-view': true,
        },
      },
    })
  }

  it('renders branding with TRƯỜNG THÀNH and ERP badge', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('TRƯỜNG THÀNH')
    expect(wrapper.text()).toContain('ERP')
    expect(wrapper.text()).toContain('Bookstore & Office Supplies')
  })

  it('renders primary standalone links: Trang chủ and Báo cáo & Thống kê', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Trang chủ')
    expect(wrapper.text()).toContain('Báo cáo & Thống kê')
  })

  it('renders the reorganized ERP business groups', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Bán hàng')
    expect(wrapper.text()).toContain('Kho & Hàng hóa')
    expect(wrapper.text()).toContain('Tài chính')
    expect(wrapper.text()).toContain('Marketing & Truyền thông')
    expect(wrapper.text()).toContain('Hệ thống')
  })

  it('collapses and expands sidebar when toggled, storing in localStorage', async () => {
    const wrapper = createWrapper()
    const aside = wrapper.find('aside')
    expect(aside.classes()).toContain('w-[268px]')

    // Find collapse button in header
    const collapseBtn = wrapper.find('button[title="Thu gọn menu"]')
    expect(collapseBtn.exists()).toBe(true)
    await collapseBtn.trigger('click')

    expect(aside.classes()).toContain('w-[70px]')
    expect(localStorage.getItem('admin_sidebar_collapsed')).toBe('true')

    // Click expand button
    const expandBtn = wrapper.find('button[title="Mở rộng menu (Ctrl+K)"]')
    expect(expandBtn.exists()).toBe(true)
    await expandBtn.trigger('click')

    expect(aside.classes()).toContain('w-[268px]')
    expect(localStorage.getItem('admin_sidebar_collapsed')).toBe('false')
  })

  it('filters navigation items with quick search', async () => {
    const wrapper = createWrapper()
    const searchInput = wrapper.find('input[placeholder="Tìm chức năng... (Ctrl+K)"]')
    expect(searchInput.exists()).toBe(true)

    await searchInput.setValue('POS')
    expect(wrapper.text()).toContain('Kết quả tìm kiếm')
    expect(wrapper.text()).toContain('Bán hàng tại quầy (POS)')

    // Clear search
    await searchInput.setValue('')
    expect(wrapper.text()).not.toContain('Kết quả tìm kiếm')
  })

  it('opens and closes Help Modal when clicking Hỗ trợ & Hướng dẫn', async () => {
    const wrapper = createWrapper()
    const helpBtn = wrapper.findAll('button').find(b => b.text().includes('Hỗ trợ & Hướng dẫn'))
    expect(helpBtn?.exists()).toBe(true)

    await helpBtn!.trigger('click')
    expect(document.body.textContent).toContain('Hỗ trợ & Hướng dẫn ERP')
    expect(document.body.textContent).toContain('0988.234.567')
  })

  it('handles logout button click', async () => {
    const wrapper = createWrapper()
    const authStore = useAuthStore()
    const logoutSpy = vi.spyOn(authStore, 'logout')

    const logoutBtn = wrapper.findAll('button').find(b => b.text().includes('Đăng xuất'))
    expect(logoutBtn?.exists()).toBe(true)

    await logoutBtn!.trigger('click')
    expect(logoutSpy).toHaveBeenCalled()
  })
})
