import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import FilterBar from '../FilterBar.vue'

afterEach(() => vi.useRealTimers())

it('does not reapply stale search text after clearing', async () => {
  vi.useFakeTimers()
  const wrapper = mount(FilterBar, { props: { modelValue: 'book' } })
  await wrapper.get('input').setValue('books')
  await wrapper.get('button').trigger('click')
  vi.runAllTimers()
  expect(wrapper.emitted('search')).toEqual([['']])
  wrapper.unmount()
})

it('cancels pending search on unmount', async () => {
  vi.useFakeTimers()
  const wrapper = mount(FilterBar)
  await wrapper.get('input').setValue('books')
  wrapper.unmount()
  vi.runAllTimers()
  expect(wrapper.emitted('search')).toBeUndefined()
})
