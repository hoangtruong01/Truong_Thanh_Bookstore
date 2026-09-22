import { mount } from '@vue/test-utils'
import { expect, it, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import FormModal from '../FormModal.vue'

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  document.body.innerHTML = ''
})

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

it('closes on Escape key', async () => {
  const wrapper = mount(FormModal, {
    props: { modelValue: true },
    global: { stubs: { teleport: true } },
  })

  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await nextTick()

  expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  expect(wrapper.emitted('cancel')).toHaveLength(1)
  wrapper.unmount()
})

it('auto-focuses first input on open', async () => {
  const wrapper = mount(FormModal, {
    props: { modelValue: true },
    slots: { default: '<input id="target-input" type="text" />' },
    attachTo: document.body,
    global: { stubs: { teleport: true } },
  })

  await nextTick()
  const inputEl = document.getElementById('target-input')
  expect(document.activeElement).toBe(inputEl)
  wrapper.unmount()
})

it('restores focus to trigger element on close', async () => {
  const triggerBtn = document.createElement('button')
  triggerBtn.id = 'trigger-btn'
  document.body.appendChild(triggerBtn)
  triggerBtn.focus()
  expect(document.activeElement).toBe(triggerBtn)

  const wrapper = mount(FormModal, {
    props: { modelValue: true },
    slots: { default: '<input id="modal-input" type="text" />' },
    attachTo: document.body,
    global: { stubs: { teleport: true } },
  })

  await nextTick()
  expect(document.activeElement).not.toBe(triggerBtn)

  await wrapper.setProps({ modelValue: false })
  await nextTick()

  expect(document.activeElement).toBe(triggerBtn)
  wrapper.unmount()
})

it('traps focus within modal when open', async () => {
  const wrapper = mount(FormModal, {
    props: { modelValue: true },
    slots: { default: '<input id="input-1" /><input id="input-2" />' },
    attachTo: document.body,
    global: { stubs: { teleport: true } },
  })

  await nextTick()
  const closeBtn = wrapper.find('button[aria-label="Đóng"]').element as HTMLElement
  const submitBtn = wrapper.find('button.bg-\\[\\#dc2626\\]').element as HTMLElement

  // Focus on close button (first focusable element in header) and hit Shift+Tab -> wrap to submitBtn (last in footer)
  closeBtn.focus()
  expect(document.activeElement).toBe(closeBtn)

  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
  await nextTick()
  expect(document.activeElement).toBe(submitBtn)

  // Focus on submitBtn (last) and hit Tab -> wrap to closeBtn (first)
  submitBtn.focus()
  expect(document.activeElement).toBe(submitBtn)

  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false, bubbles: true }))
  await nextTick()
  expect(document.activeElement).toBe(closeBtn)

  wrapper.unmount()
})
