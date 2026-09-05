import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import ImageUploader from '../ImageUploader.vue'

async function select(wrapper: ReturnType<typeof mount>, files: File[]) {
  Object.defineProperty(wrapper.get('input[type=file]').element, 'files', { value: files, configurable: true })
  await wrapper.get('input[type=file]').trigger('change')
}

it('preserves all selected images in one model update', async () => {
  const wrapper = mount(ImageUploader, { props: { modelValue: [], multiple: true } })
  await select(wrapper, [new File(['one'], 'one.png', { type: 'image/png' }), new File(['two'], 'two.png', { type: 'image/png' })])
  await vi.waitFor(() => expect(wrapper.emitted('update:modelValue')).toHaveLength(1))
  const images = wrapper.emitted('update:modelValue')![0]![0] as string[]
  expect(images).toHaveLength(2)
  expect(images[0]).not.toBe(images[1])
  wrapper.unmount()
})

it('rejects unsupported file types before uploading', async () => {
  const wrapper = mount(ImageUploader, { props: { modelValue: '' } })
  await select(wrapper, [new File(['text'], 'notes.txt', { type: 'text/plain' })])
  expect(wrapper.emitted('upload-file')).toBeUndefined()
  expect(wrapper.text()).toContain('Định dạng ảnh không được hỗ trợ')
  wrapper.unmount()
})

it('enforces the image limit before uploading', async () => {
  const wrapper = mount(ImageUploader, { props: { modelValue: ['https://example.com/a.png'], multiple: true, maxImages: 1 } })
  await select(wrapper, [new File(['one'], 'one.png', { type: 'image/png' })])
  expect(wrapper.emitted('upload-file')).toBeUndefined()
  expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  wrapper.unmount()
})
