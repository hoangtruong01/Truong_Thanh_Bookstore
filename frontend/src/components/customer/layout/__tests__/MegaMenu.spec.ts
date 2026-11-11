import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import MegaMenu from '../MegaMenu.vue'
import type { Category } from '@/types'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

const cat = (over: Partial<Category>): Category =>
  ({ _id: '', name: '', slug: '', status: true, createdAt: '', updatedAt: '', ...over }) as Category

const STATIONERY = cat({ _id: 'root1', name: 'Văn phòng phẩm', slug: 'van-phong-pham' })
const COMBO = cat({
  _id: 'root2',
  name: 'Combo',
  slug: 'combo',
  products: [
    { _id: 'p1', name: 'Combo học sinh', images: ['https://img/c1.jpg'], price: 100000, discountPrice: 90000 } as any,
  ],
})
const PENS = cat({ _id: 'sub1', name: 'Bút viết', slug: 'but-viet', parentId: 'root1' })
// populated parent object, as returned by some endpoints
const PAPER = cat({ _id: 'sub2', name: 'Giấy', slug: 'giay', parentId: { _id: 'root1' } as any })
const GEL = cat({ _id: 'grand1', name: 'Bút gel', slug: 'but-gel', parentId: 'sub1' })
// "combo" has a child but the menu always shows its products instead
const COMBO_CHILD = cat({ _id: 'sub3', name: 'Combo con', slug: 'combo-con', parentId: 'root2' })

const ALL = [STATIONERY, COMBO, PENS, PAPER, GEL, COMBO_CHILD]
const PARENTS = [STATIONERY, COMBO]

function mountMenu(categories = ALL, parentCategories = PARENTS) {
  return mount(MegaMenu, {
    props: { categories, parentCategories },
    global: { stubs: { 'router-link': RouterLinkStub } },
  })
}

describe('MegaMenu.vue', () => {
  beforeEach(() => vi.clearAllMocks())

  it('opens on hover and highlights the first root category', async () => {
    const wrapper = mountMenu()
    const panel = wrapper.find('[data-testid="mega-menu-panel"]')
    expect((panel.element as HTMLElement).style.display).toBe('none')

    await wrapper.trigger('mouseenter')
    expect((panel.element as HTMLElement).style.display).toBe('')
    expect(panel.find('h3').text()).toBe('Văn phòng phẩm')
  })

  it('lists level 2 children (string or populated parentId) with level 3 grandchildren', () => {
    const wrapper = mountMenu()
    const links = wrapper.findAllComponents(RouterLinkStub).map((l) => l.props('to'))
    expect(links).toEqual([
      '/products?category=sub1',
      '/products?category=grand1',
      '/products?category=sub2',
    ])
  })

  it('shows featured products (lazy images) for the combo category instead of children', async () => {
    const wrapper = mountMenu()
    await wrapper.findAll('button[type="button"]').find((b) => b.text() === 'Combo')!.trigger('mouseenter')

    expect(wrapper.text()).toContain('Sản phẩm nổi bật')
    expect(wrapper.text()).not.toContain('Combo con')
    const img = wrapper.find('img')
    expect(img.attributes('loading')).toBe('lazy')
    expect(img.attributes('alt')).toBe('Product thumbnail')
  })

  it('shows the empty state for a root without children or products', () => {
    const lonely = cat({ _id: 'root3', name: 'Khác', slug: 'khac' })
    const wrapper = mountMenu([lonely], [lonely])
    expect(wrapper.text()).toContain('Chưa có sản phẩm hoặc danh mục con')
  })

  it('selects the first root once categories load later', async () => {
    const wrapper = mountMenu([], [])
    expect(wrapper.find('h3').exists()).toBe(false)
    await wrapper.setProps({ categories: ALL, parentCategories: PARENTS })
    expect(wrapper.find('h3').text()).toBe('Văn phòng phẩm')
  })

  it('navigates to a category and closes the menu', async () => {
    const wrapper = mountMenu()
    await wrapper.trigger('mouseenter')
    await wrapper.findAll('button[type="button"]').find((b) => b.text() === 'Văn phòng phẩm')!.trigger('click')

    expect(push).toHaveBeenCalledWith('/products?category=root1')
    expect((wrapper.find('[data-testid="mega-menu-panel"]').element as HTMLElement).style.display).toBe('none')
  })
})
