import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import OrderDetail from '../OrderDetail.vue'
import { orderService } from '@/services/order.service'
import { paymentService } from '@/services/payment.service'

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: 'test_order_bank_01' },
    name: 'OrderDetail',
  }),
}))

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/services/order.service', () => ({
  orderService: {
    getById: vi.fn(),
    getGuestById: vi.fn(),
    cancel: vi.fn(),
    requestReturn: vi.fn(),
  },
}))

vi.mock('@/services/payment.service', () => ({
  paymentService: {
    getEnabledMethods: vi.fn(),
    create: vi.fn(),
  },
}))

describe('OrderDetail.vue (BUG-001 Dynamic Bank Transfer & VietQR)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dynamic bank information and VietQR URL from paymentService.getEnabledMethods', async () => {
    const mockOrder = {
      _id: 'test_order_bank_01',
      orderCode: 'TT261031TEST',
      orderStatus: 'PENDING',
      paymentStatus: 'UNPAID',
      paymentMethod: 'BANK_TRANSFER',
      items: [
        {
          product: { _id: 'prod_1', name: 'Sách A', images: [] },
          name: 'Sách A',
          price: 150000,
          quantity: 1,
        },
      ],
      subtotal: 150000,
      shippingFee: 30000,
      discount: 0,
      total: 180000,
      shippingAddress: '123 Nguyễn Trãi, Q.5',
      customerName: 'Nguyễn Văn A',
      phone: '0901234567',
      createdAt: '2026-10-31T00:00:00.000Z',
    }

    vi.mocked(orderService.getById).mockResolvedValue({ data: mockOrder } as any)
    vi.mocked(paymentService.getEnabledMethods).mockResolvedValue({
      data: {
        methods: ['BANK_TRANSFER', 'COD'],
        bankTransfer: {
          bankName: 'Techcombank',
          accountNumber: '9988776655',
          accountHolder: 'NHA SACH TRUONG THANH DONG BO',
        },
      },
    } as any)

    const wrapper = mount(OrderDetail, {
      global: {
        stubs: ['router-link', 'SkeletonLoader'],
      },
    })

    await flushPromises()

    // Verify dynamic account number and bank name appear in DOM
    expect(wrapper.text()).toContain('Techcombank')
    expect(wrapper.text()).toContain('9988776655')
    expect(wrapper.text()).toContain('NHA SACH TRUONG THANH DONG BO')
    expect(wrapper.text()).not.toContain('0345678999') // Old hardcoded number eliminated

    // Verify QR image URL contains the dynamic account number and order code
    const qrImage = wrapper.find('img[alt="VietQR Chuyển Khoản"]')
    expect(qrImage.exists()).toBe(true)
    const src = qrImage.attributes('src') || ''
    expect(src).toContain('Techcombank')
    expect(src).toContain('9988776655')
    expect(src).toContain('TT261031TEST')
    expect(src).toContain('180000')
  })

  it('shows graceful hotline fallback when bank transfer config is not available', async () => {
    const mockOrder = {
      _id: 'test_order_bank_02',
      orderCode: 'TT261031TEST2',
      orderStatus: 'PENDING',
      paymentStatus: 'UNPAID',
      paymentMethod: 'BANK_TRANSFER',
      items: [],
      subtotal: 100000,
      shippingFee: 0,
      discount: 0,
      total: 100000,
      shippingAddress: '123 Nguyễn Trãi',
      phone: '0901234567',
      createdAt: '2026-10-31T00:00:00.000Z',
    }

    vi.mocked(orderService.getById).mockResolvedValue({ data: mockOrder } as any)
    vi.mocked(paymentService.getEnabledMethods).mockResolvedValue({
      data: {
        methods: ['COD'],
        bankTransfer: null,
      },
    } as any)

    const wrapper = mount(OrderDetail, {
      global: {
        stubs: ['router-link', 'SkeletonLoader'],
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('0982938316')
    expect(wrapper.find('img[alt="VietQR Chuyển Khoản"]').exists()).toBe(false)
  })
})

