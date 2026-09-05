import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import FormModal from '../FormModal.vue'

it('locks initially open modals and preserves the lock until every modal closes', async () => {
  document.body.style.overflow = 'auto'
  const first = mount(FormModal, { props: { modelValue: true } })
  const second = mount(FormModal, { props: { modelValue: true } })
  const closed = mount(FormModal, { props: { modelValue: false } })
  expect(document.body.style.overflow).toBe('hidden')
  closed.unmount()
  expect(document.body.style.overflow).toBe('hidden')
  first.unmount()
  expect(document.body.style.overflow).toBe('hidden')
  await second.setProps({ modelValue: false })
  expect(document.body.style.overflow).toBe('auto')
  second.unmount()
  document.body.style.overflow = ''
})

it('validates the slotted form before confirming from the footer', async () => {
  const wrapper = mount(FormModal, {
    props: { modelValue: true, confirmText: 'Save' },
    slots: { default: '<form><input required /></form>' },
    global: { stubs: { teleport: true } },
  })
  const validity = vi.spyOn(wrapper.get('form').element, 'reportValidity').mockReturnValue(false)
  const save = wrapper.findAll('button').find(button => button.text() === 'Save')!
  await save.trigger('click')
  expect(wrapper.emitted('confirm')).toBeUndefined()
  validity.mockReturnValue(true)
  await save.trigger('click')
  expect(wrapper.emitted('confirm')).toHaveLength(1)
  wrapper.unmount()
})
