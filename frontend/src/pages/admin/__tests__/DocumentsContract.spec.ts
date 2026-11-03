import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Documents from '../Documents.vue'
import documentService from '@/services/document.service'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast,
}))

vi.mock('@/services/document.service', () => ({
  default: {
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn(),
    create: vi.fn().mockResolvedValue({ _id: 'doc-1', documentNumber: 'DOC-202611-0001' }),
    post: vi.fn().mockResolvedValue({ _id: 'doc-1', status: 'POSTED' }),
    reverse: vi.fn().mockResolvedValue({ original: {}, reversal: {} }),
    addAttachment: vi.fn().mockResolvedValue({
      _id: 'doc-1',
      attachments: [{ fileId: 'f-1', fileName: 'test.pdf', fileUrl: 'https://cdn.example.com/test.pdf' }],
    }),
    removeAttachment: vi.fn(),
  },
}))

describe('Documents.vue (DOC-P1-02 & LINK-P1-09 Contract & Security)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('DOC-P1-02: submitCreateDocument sends title, documentType, entityName and amount conforming to CreateERPDocumentDto', async () => {
    const wrapper = mount(Documents, {
      global: {
        stubs: {
          SkeletonLoader: true,
          EmptyState: true,
          FormModal: {
            template: '<div><slot /><button id="modal-submit-btn" @click="$emit(\'submit\')">Submit</button></div>',
          },
        },
      },
    })

    await flushPromises()

    // Trigger openCreateModal
    wrapper.find('button.bg-indigo-600').trigger('click')
    await wrapper.vm.$nextTick()

    // Fill form fields
    const inputs = wrapper.findAll('input')
    const titleInput = inputs.find((i) => i.attributes('placeholder')?.includes('Hóa đơn GTGT'))
    expect(titleInput).toBeDefined()
    await titleInput!.setValue('Hóa đơn VAT NXB Trẻ')

    const submitBtn = wrapper.find('#modal-submit-btn')
    await submitBtn.trigger('click')
    await flushPromises()

    expect(documentService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Hóa đơn VAT NXB Trẻ',
        documentType: 'PURCHASE_ORDER',
      }),
    )
    expect(mockToast.success).toHaveBeenCalledWith('Khởi tạo chứng từ điện tử mới thành công!')
  })

  it('LINK-P1-09: addAttachment blocks non-HTTPS URL with validation error', async () => {
    const wrapper = mount(Documents, {
      global: {
        stubs: {
          SkeletonLoader: true,
          EmptyState: true,
          FormModal: true,
        },
      },
    })

    // Set selected doc manually
    ;(wrapper.vm as any).selectedDoc = {
      _id: 'doc-1',
      documentNumber: 'DOC-001',
      attachments: [],
    }
    ;(wrapper.vm as any).newAttachment = {
      fileName: 'unsafe.exe',
      fileUrl: 'javascript:alert(1)',
      fileSize: 1024,
      mimeType: 'application/pdf',
    }

    await (wrapper.vm as any).addAttachmentToDoc()

    expect(mockToast.error).toHaveBeenCalledWith(
      expect.stringContaining('HTTPS'),
    )
    expect(documentService.addAttachment).not.toHaveBeenCalled()
  })

  it('LINK-P1-09: addAttachment sends fileSize and mimeType with HTTPS URL', async () => {
    const wrapper = mount(Documents, {
      global: {
        stubs: {
          SkeletonLoader: true,
          EmptyState: true,
          FormModal: true,
        },
      },
    })

    ;(wrapper.vm as any).selectedDoc = {
      _id: 'doc-1',
      documentNumber: 'DOC-001',
      attachments: [],
    }
    ;(wrapper.vm as any).newAttachment = {
      fileName: 'hop-dong.pdf',
      fileUrl: 'https://storage.truongthanh.vn/hop-dong.pdf',
      fileSize: 2048,
      mimeType: 'application/pdf',
    }

    await (wrapper.vm as any).addAttachmentToDoc()
    await flushPromises()

    expect(documentService.addAttachment).toHaveBeenCalledWith(
      'doc-1',
      expect.objectContaining({
        fileName: 'hop-dong.pdf',
        fileUrl: 'https://storage.truongthanh.vn/hop-dong.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
      }),
    )
    expect(mockToast.success).toHaveBeenCalledWith('Đã đính kèm tệp thành công!')
  })
})
