import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ComboBundle from '../ComboBundle.vue'

const member = (id: string, price: number, discountPrice = 0) =>
  ({ _id: id, name: `SP ${id}`, brand: '', price, discountPrice, images: [] }) as any

const comboProduct = (price: number, discountPrice = 0) => ({ _id: 'combo', name: 'Combo', price, discountPrice }) as any

const category = (products: any[], comboPrice = 1) => ({ _id: 'c1', name: 'Combo', products, comboPrice }) as any

describe('ComboBundle', () => {
  it('renders nothing without a combo price or members', () => {
    expect(mount(ComboBundle, { props: { product: comboProduct(100), category: null } }).html()).not.toContain('Combo:')
    expect(
      mount(ComboBundle, { props: { product: comboProduct(100), category: category([member('a', 50)], 0) } }).html(),
    ).not.toContain('Combo:')
  })

  it('shows the saving badge and struck retail total when the combo is cheaper', () => {
    const wrapper = mount(ComboBundle, {
      props: { product: comboProduct(80000), category: category([member('a', 50000), member('b', 50000)]) },
    })
    expect(wrapper.text()).toContain('Tiết kiệm')
    expect(wrapper.text()).toContain('20.000')
    expect(wrapper.text()).toContain('(-20%)')
    expect(wrapper.findAll('.line-through').some((el) => el.text().includes('100.000'))).toBe(true)
  })

  it('hides "Tiết kiệm 0 đ (-0%)" when the combo is not cheaper than buying separately', () => {
    const wrapper = mount(ComboBundle, {
      props: { product: comboProduct(100000), category: category([member('a', 50000), member('b', 50000)]) },
    })
    expect(wrapper.text()).toContain('Tổng giá bán lẻ')
    expect(wrapper.text()).not.toContain('Tiết kiệm')
    expect(wrapper.findAll('.line-through')).toHaveLength(0)
  })

  it('strikes a member price only when its discount is real', () => {
    const wrapper = mount(ComboBundle, {
      props: {
        product: comboProduct(10),
        category: category([member('a', 50000, 40000), member('b', 30000, 30000)]),
      },
    })
    const struck = wrapper.findAll('.text-\\[9px\\].line-through')
    expect(struck).toHaveLength(1)
    expect(struck[0].text()).toContain('50.000')
  })

  it('collapses to 5 members with a toggle', async () => {
    const products = Array.from({ length: 7 }, (_, i) => member(String(i), 1000))
    const wrapper = mount(ComboBundle, { props: { product: comboProduct(1000), category: category(products) } })
    expect(wrapper.findAll('img')).toHaveLength(5)
    const toggle = wrapper.find('button')
    expect(toggle.text()).toContain('Xem thêm 2 sản phẩm')
    await toggle.trigger('click')
    expect(wrapper.findAll('img')).toHaveLength(7)
    expect(wrapper.find('button').text()).toContain('Thu gọn danh sách')
  })
})
