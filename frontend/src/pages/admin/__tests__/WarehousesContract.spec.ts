import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Warehouses from '../Warehouses.vue'
import warehouseService from '@/services/warehouse.service'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast,
}))

vi.mock('@/services/warehouse.service', () => ({
  default: {
    getAll: vi.fn().mockResolvedValue([
      { _id: 'wh-1', code: 'KHO-TONG', name: 'Kho Tổng', type: 'MAIN', isActive: true },
      { _id: 'wh-2', code: 'KHO-STORE', name: 'Kho Cửa Hàng', type: 'STORE', isActive: true },
    ]),
    getTransfers: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ _id: 'wh-new', code: 'KHO-NEW', name: 'Kho Mới' }),
    createTransfer: vi.fn().mockResolvedValue({ _id: 'trf-1', code: 'TRF-001' }),
    receiveTransfer: vi.fn().mockResolvedValue({ _id: 'trf-1', status: 'COMPLETED' }),
    approveTransfer: vi.fn(),
    shipTransfer: vi.fn(),
    cancelTransfer: vi.fn(),
    getStock: vi.fn().mockResolvedValue([]),
  },
}))

describe('Warehouses.vue (WH-P1-03 UI/API Contract)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm = vi.fn().mockReturnValue(true)
  })

  it('WH-P1-03: submitCreateWarehouse does not send isSellable to backend', async () => {
    const wrapper = mount(Warehouses, {
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

    ;(wrapper.vm as any).warehouseForm = {
      code: 'kho-phu',
      name: 'Kho Phụ Long An',
      type: 'MAIN',
      address: '123 QL1A',
    }

    await (wrapper.vm as any).submitCreateWarehouse()
    await flushPromises()

    expect(warehouseService.create).toHaveBeenCalledWith({
      code: 'KHO-PHU',
      name: 'Kho Phụ Long An',
      type: 'MAIN',
      address: '123 QL1A',
    })
    expect((warehouseService.create as any).mock.calls[0][0].isSellable).toBeUndefined()
    expect(mockToast.success).toHaveBeenCalledWith('Khởi tạo kho hàng mới thành công!')
  })

  it('WH-P1-03: submitCreateTransfer sends canonical fromWarehouse, toWarehouse, and items array', async () => {
    const wrapper = mount(Warehouses, {
      global: {
        stubs: {
          SkeletonLoader: true,
          EmptyState: true,
          FormModal: true,
        },
      },
    })
    await flushPromises()

    ;(wrapper.vm as any).transferForm = {
      fromWarehouse: 'wh-1',
      toWarehouse: 'wh-2',
      productId: 'prod-abc-123',
      requestedQty: 5,
      itemNote: 'Chuyển gấp',
      note: 'Lệnh số 10',
    }

    await (wrapper.vm as any).submitCreateTransfer()
    await flushPromises()

    expect(warehouseService.createTransfer).toHaveBeenCalledWith({
      fromWarehouse: 'wh-1',
      toWarehouse: 'wh-2',
      note: 'Lệnh số 10',
      items: [
        {
          product: 'prod-abc-123',
          requestedQty: 5,
          note: 'Chuyển gấp',
        },
      ],
    })
    expect(mockToast.success).toHaveBeenCalledWith('Lập phiếu chuyển kho thành công!')
  })

  it('WH-P1-03: receiveTransfer sends items array conforming to ReceiveStockTransferDto', async () => {
    const wrapper = mount(Warehouses, {
      global: {
        stubs: {
          SkeletonLoader: true,
          EmptyState: true,
          FormModal: true,
        },
      },
    })
    await flushPromises()

    const mockTransfer: any = {
      _id: 'trf-1',
      code: 'TRF-202611-0001',
      items: [
        {
          product: { _id: 'prod-123', title: 'Sách Đắc Nhân Tâm' },
          requestedQty: 10,
          note: 'Hàng nguyên seal',
        },
      ],
    }

    await (wrapper.vm as any).receiveTransfer(mockTransfer)
    await flushPromises()

    expect(warehouseService.receiveTransfer).toHaveBeenCalledWith(
      'trf-1',
      expect.objectContaining({
        items: [
          {
            product: 'prod-123',
            receivedQty: 10,
            note: 'Hàng nguyên seal',
          },
        ],
      }),
    )
    expect(mockToast.success).toHaveBeenCalledWith(
      expect.stringContaining('Đã xác nhận nhập kho thành công'),
    )
  })
})
