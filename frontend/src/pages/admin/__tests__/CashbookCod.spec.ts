import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Cashbook from '../Cashbook.vue'
import { financeService } from '@/services/finance.service'

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/services/finance.service', () => ({
  financeService: {
    getAccounts: vi.fn(),
    getEntries: vi.fn(),
    getPayables: vi.fn(),
    getReceivables: vi.fn(),
    getAgingReport: vi.fn(),
    getPendingCodOrders: vi.fn(),
    getCodBatches: vi.fn(),
    reconcileCodStatement: vi.fn(),
    createEntry: vi.fn(),
    reverseEntry: vi.fn(),
    paySupplier: vi.fn(),
    collectCustomerPayment: vi.fn(),
    exportEntries: vi.fn(),
  },
}))

describe('Cashbook.vue (FIN-COD-01 COD Logistics Reconciliation UI)', () => {
  const mockAccounts = [
    {
      _id: 'acc_bank_01',
      code: 'BANK-MB',
      name: 'Tài khoản MB Bank',
      type: 'BANK_ACCOUNT',
      openingBalance: 10000000,
      currentBalance: 50000000,
      status: 'ACTIVE',
      createdAt: '2026-11-01',
    },
  ]

  const mockPendingCodOrders = [
    {
      _id: 'order_cod_01',
      orderCode: 'ORD-COD-881',
      customerName: 'Hoàng Văn B',
      phone: '0988776655',
      shippingAddress: '789 Trần Hưng Đạo',
      total: 350000,
      trackingCode: 'GHN_TRACK_881',
      shippingStatus: 'DELIVERED',
      deliveredAt: '2026-11-02T10:00:00Z',
      codStatus: 'PENDING_RECONCILIATION',
    },
    {
      _id: 'order_cod_02',
      orderCode: 'ORD-COD-882',
      customerName: 'Lê Thị C',
      phone: '0977665544',
      shippingAddress: '12 Hai Bà Trưng',
      total: 200000,
      trackingCode: 'GHN_TRACK_882',
      shippingStatus: 'DELIVERED',
      deliveredAt: '2026-11-02T11:00:00Z',
      codStatus: 'PENDING_RECONCILIATION',
    },
  ]

  const mockBatches = [
    {
      _id: 'batch_01',
      statementId: 'STMT-GHN-20261102-01',
      carrier: 'GHN',
      bankAccount: { _id: 'acc_bank_01', code: 'BANK-MB', name: 'Tài khoản MB Bank' },
      totalCod: 550000,
      totalShipping: 44000,
      netPayout: 506000,
      matchedOrdersCount: 2,
      discrepanciesCount: 0,
      discrepancies: [],
      createdAt: '2026-11-02T16:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(financeService.getAccounts).mockResolvedValue(mockAccounts as any)
    vi.mocked(financeService.getEntries).mockResolvedValue({ data: [], total: 0 } as any)
    vi.mocked(financeService.getPayables).mockResolvedValue({ data: [], total: 0 } as any)
    vi.mocked(financeService.getReceivables).mockResolvedValue({ data: [], total: 0 } as any)
    vi.mocked(financeService.getAgingReport).mockResolvedValue({ totalOutstanding: 0 } as any)
    vi.mocked(financeService.getPendingCodOrders).mockResolvedValue(mockPendingCodOrders as any)
    vi.mocked(financeService.getCodBatches).mockResolvedValue(mockBatches as any)
  })

  it('renders COD Logistics tab with pending orders count badge', async () => {
    const wrapper = mount(Cashbook)
    await flushPromises()

    const codTab = wrapper.findAll('button').find((b) => b.text().includes('Đối Soát COD Logistics'))
    expect(codTab).toBeDefined()
    expect(codTab?.text()).toContain('2') // 2 pending orders
  })

  it('switches to COD tab and displays summary KPI cards and pending orders table', async () => {
    const wrapper = mount(Cashbook)
    await flushPromises()

    const codTab = wrapper.findAll('button').find((b) => b.text().includes('Đối Soát COD Logistics'))
    await codTab?.trigger('click')
    await flushPromises()

    // Verify KPI summary
    expect(wrapper.text()).toContain('COD Đang Chờ Đối Soát')
    expect(wrapper.text()).toContain('550.000') // 350k + 200k = 550k
    expect(wrapper.text()).toContain('Số Lô Bảng Kê Đã Khớp')
    expect(wrapper.text()).toContain('Thực Nhận (Net Payout)')

    // Verify Pending COD Orders table
    expect(wrapper.text()).toContain('ORD-COD-881')
    expect(wrapper.text()).toContain('GHN_TRACK_881')
    expect(wrapper.text()).toContain('ORD-COD-882')
    expect(wrapper.text()).toContain('GHN_TRACK_882')

    // Verify Past Reconciliation Batches table
    expect(wrapper.text()).toContain('STMT-GHN-20261102-01')
    expect(wrapper.text()).toContain('Khớp 100%')
  })

  it('populates selected pending orders into statement creation modal and computes net payout', async () => {
    const wrapper = mount(Cashbook)
    await flushPromises()

    const codTab = wrapper.findAll('button').find((b) => b.text().includes('Đối Soát COD Logistics'))
    await codTab?.trigger('click')
    await flushPromises()

    // Select the first pending order checkbox
    const checkboxes = wrapper.findAll('tbody input[type="checkbox"]')
    expect(checkboxes.length).toBeGreaterThan(0)
    await checkboxes[0].setValue(true)
    await flushPromises()

    // Click "Lập bảng kê từ 1 đơn đã chọn"
    const createFromSelectedBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Lập bảng kê từ 1 đơn đã chọn'))
    expect(createFromSelectedBtn).toBeDefined()
    await createFromSelectedBtn?.trigger('click')
    await flushPromises()

    // Modal should be open
    expect(wrapper.text()).toContain('Lập Bảng Kê Đối Soát COD Logistics')
    expect(wrapper.text()).toContain('GHN_TRACK_881')

    // Submit statement
    vi.mocked(financeService.reconcileCodStatement).mockResolvedValue({
      matchedOrdersCount: 1,
      netPayout: 328000,
    } as any)

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(financeService.reconcileCodStatement).toHaveBeenCalledWith(
      expect.objectContaining({
        carrier: 'GHN',
        bankAccountId: 'acc_bank_01',
        items: expect.arrayContaining([
          expect.objectContaining({
            trackingCode: 'GHN_TRACK_881',
            codAmount: 350000,
          }),
        ]),
      }),
    )
  })
})
