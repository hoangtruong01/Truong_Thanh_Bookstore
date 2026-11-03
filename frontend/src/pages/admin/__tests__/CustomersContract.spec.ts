import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Customers from '../Customers.vue'
import { customerService } from '@/services/customer.service'
import { financeService } from '@/services/finance.service'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast,
}))

vi.mock('@/services/customer.service', () => ({
  customerService: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
    updateCRMProfile: vi.fn().mockResolvedValue({}),
    evaluateTier: vi.fn().mockResolvedValue({ tier: 'GOLD' }),
  },
}))

vi.mock('@/services/finance.service', () => ({
  financeService: {
    updateCreditProfile: vi.fn().mockResolvedValue({}),
  },
}))

describe('Customers.vue (CRM-P1-04 Decoupled CRM and Credit Profile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('CRM-P1-04: submitCreditProfile calls customerService with tier & customerType, and financeService with creditLimit & terms', async () => {
    const wrapper = mount(Customers, {
      global: {
        stubs: {
          FilterBar: true,
          DataTable: true,
          StatusBadge: true,
        },
      },
    })
    await flushPromises()

    ;(wrapper.vm as any).selectedCustomer = {
      _id: 'cust-123',
      fullName: 'Tran Van Khach',
      phone: '0901234567',
    }
    ;(wrapper.vm as any).creditForm = {
      tier: 'GOLD',
      customerType: 'WHOLESALE',
      creditLimit: 25000000,
      paymentTermDays: 45,
      creditStatus: 'ACTIVE',
      reason: 'Nâng hạn mức đại lý vàng quý 4',
    }

    await (wrapper.vm as any).submitCreditProfile()
    await flushPromises()

    expect(customerService.updateCRMProfile).toHaveBeenCalledWith(
      'cust-123',
      {
        tier: 'GOLD',
        customerType: 'WHOLESALE',
        reason: 'Nâng hạn mức đại lý vàng quý 4',
      },
    )

    expect(financeService.updateCreditProfile).toHaveBeenCalledWith(
      'cust-123',
      {
        creditLimit: 25000000,
        paymentTermDays: 45,
        creditStatus: 'ACTIVE',
        reason: 'Nâng hạn mức đại lý vàng quý 4',
      },
    )

    expect(mockToast.success).toHaveBeenCalledWith(
      expect.stringContaining('Đã cập nhật hạn mức tín dụng'),
    )
  })
})
