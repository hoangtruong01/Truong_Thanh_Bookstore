import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDoubleSubmit } from '@/composables/useDoubleSubmit'

describe('QA-04: Checkout UX & Fee Transparency Regression Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // =========================================================================
  // TEST 1: MINH BẠCH 5 KHOẢN CHI PHÍ & NGƯỠNG FREESHIP (FE-06)
  // =========================================================================
  describe('1. Fee Transparency & Grand Total Invariants', () => {
    const FREE_SHIPPING_THRESHOLD = 299000
    const DEFAULT_SHIPPING_FEE = 30000

    const calculateCheckoutBreakdown = (
      items: Array<{ price: number; quantity: number }>,
      voucherDiscount = 0,
      loyaltyDiscount = 0,
    ) => {
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE
      const freeshipRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
      const grandTotal = Math.max(0, subtotal + shippingFee - voucherDiscount - loyaltyDiscount)

      return {
        subtotal,
        shippingFee,
        freeshipRemaining,
        voucherDiscount,
        loyaltyDiscount,
        grandTotal,
        isFreeship: shippingFee === 0,
      }
    }

    it('tính đúng phí ship 30.000đ khi tạm tính < 299.000đ và hiển thị đúng số tiền cần mua thêm để freeship', () => {
      const items = [{ price: 120000, quantity: 2 }] // Subtotal = 240,000đ
      const breakdown = calculateCheckoutBreakdown(items)

      expect(breakdown.subtotal).toBe(240000)
      expect(breakdown.shippingFee).toBe(30000)
      expect(breakdown.isFreeship).toBe(false)
      expect(breakdown.freeshipRemaining).toBe(59000) // 299,000 - 240,000
      expect(breakdown.grandTotal).toBe(270000) // 240,000 + 30,000
    })

    it('tự động miễn phí vận chuyển (0đ) khi tạm tính >= 299.000đ', () => {
      const items = [{ price: 150000, quantity: 2 }] // Subtotal = 300,000đ
      const breakdown = calculateCheckoutBreakdown(items)

      expect(breakdown.subtotal).toBe(300000)
      expect(breakdown.shippingFee).toBe(0)
      expect(breakdown.isFreeship).toBe(true)
      expect(breakdown.freeshipRemaining).toBe(0)
      expect(breakdown.grandTotal).toBe(300000)
    })

    it('áp dụng cả voucher và điểm thưởng chính xác, không bao giờ để tổng tiền bị âm', () => {
      const items = [{ price: 200000, quantity: 1 }] // Subtotal = 200,000, Ship = 30,000
      const voucherDiscount = 50000
      const loyaltyDiscount = 30000
      const breakdown = calculateCheckoutBreakdown(items, voucherDiscount, loyaltyDiscount)

      expect(breakdown.grandTotal).toBe(150000) // 200,000 + 30,000 - 50,000 - 30,000

      // Trường hợp giảm giá vượt quá tổng tiền
      const massiveDiscounts = calculateCheckoutBreakdown(items, 200000, 100000)
      expect(massiveDiscounts.grandTotal).toBe(0) // Math.max(0, ...)
    })
  })

  // =========================================================================
  // TEST 2: CẢNH BÁO TỒN KHO THỜI GIAN THỰC & ĐIỀU CHỈNH SỐ LƯỢNG (FE-06)
  // =========================================================================
  describe('2. Real-Time Stock Warning & Auto-Adjustment', () => {
    it('phát hiện sản phẩm vượt tồn kho và điều chỉnh về mức tồn kho tối đa có sẵn', () => {
      const cartItems = [
        { productId: 'prod-001', name: 'Sách A', quantity: 5, stock: 2 },
        { productId: 'prod-002', name: 'Sách B', quantity: 1, stock: 10 },
      ]

      // Kiểm tra phát hiện sản phẩm thiếu hàng
      const stockIssues = cartItems.filter((item) => item.quantity > item.stock)
      expect(stockIssues).toHaveLength(1)
      expect(stockIssues[0].name).toBe('Sách A')
      expect(stockIssues[0].stock).toBe(2)

      // Kích hoạt tiện ích 1-click điều chỉnh số lượng
      const adjustToAvailableStock = (item: { quantity: number; stock: number }) => {
        item.quantity = Math.max(0, item.stock)
      }

      adjustToAvailableStock(cartItems[0])

      expect(cartItems[0].quantity).toBe(2)
      // Sau khi điều chỉnh, không còn sản phẩm nào vi phạm tồn kho
      const remainingIssues = cartItems.filter((item) => item.quantity > item.stock)
      expect(remainingIssues).toHaveLength(0)
    })
  })

  // =========================================================================
  // TEST 3: CHỐNG TRÙNG LẶP ĐƠN HÀNG (DOUBLE SUBMIT RACE PROTECTION) (FE-05)
  // =========================================================================
  describe('3. Double Submit & Rapid Click Protection', () => {
    it('chặn hoàn toàn click đúp / spam click nút Đặt Hàng và chỉ gọi API duy nhất 1 lần', async () => {
      const { isSubmitting, runProtected } = useDoubleSubmit(0)
      let apiCallCount = 0

      const submitOrderApi = () =>
        new Promise<{ orderCode: string }>((resolve) => {
          setTimeout(() => {
            apiCallCount++
            resolve({ orderCode: 'TTB-SUCCESS-001' })
          }, 80)
        })

      // Giả lập người dùng click 4 lần liên tục trong 10ms
      const click1 = runProtected(submitOrderApi)
      expect(isSubmitting.value).toBe(true)

      const click2 = runProtected(submitOrderApi)
      const click3 = runProtected(submitOrderApi)
      const click4 = runProtected(submitOrderApi)

      const [res1, res2, res3, res4] = await Promise.all([click1, click2, click3, click4])

      expect(res1).toEqual({ orderCode: 'TTB-SUCCESS-001' })
      expect(res2).toBeUndefined()
      expect(res3).toBeUndefined()
      expect(res4).toBeUndefined()

      // Khẳng định chỉ 1 request thực sự được phát đi
      expect(apiCallCount).toBe(1)
      expect(isSubmitting.value).toBe(false)
    })
  })

  // =========================================================================
  // TEST 4: GIẢ LẬP MẠNG CHẬM / SLOW NETWORK LOADING STATE
  // =========================================================================
  describe('4. Slow Network & Loading UI Lock', () => {
    it('duy trì cờ loading trong toàn bộ quá trình chờ response và mở khóa khi hoàn tất', async () => {
      const { isSubmitting, runProtected } = useDoubleSubmit(0)

      let networkDelayedTaskCompleted = false
      const slowNetworkOrderPlacement = () =>
        new Promise<string>((resolve) => {
          setTimeout(() => {
            networkDelayedTaskCompleted = true
            resolve('COMPLETED')
          }, 100)
        })

      const taskPromise = runProtected(slowNetworkOrderPlacement)

      // Trong khi chờ mạng, cờ isSubmitting phải là true
      expect(isSubmitting.value).toBe(true)
      expect(networkDelayedTaskCompleted).toBe(false)

      const result = await taskPromise

      // Khi mạng hoàn tất
      expect(result).toBe('COMPLETED')
      expect(networkDelayedTaskCompleted).toBe(true)
      expect(isSubmitting.value).toBe(false)
    })
  })

  // =========================================================================
  // TEST 5: TẠO MÃ VIETQR CHUYỂN KHOẢN CHUẨN NAPAS (FE-06)
  // =========================================================================
  describe('5. VietQR Dynamic Generation & Formatting', () => {
    const generateVietQrUrl = (
      orderCode: string,
      amount: number,
      bankCode = 'MB',
      accountNumber = '0335012558',
      accountName = 'NGUYEN HOANG TRUONG',
    ) => {
      const cleanOrderCode = orderCode.replace(/^#/, '').trim()
      const transferMemo = `TTB ${cleanOrderCode}`
      const roundedAmount = Math.max(0, Math.round(amount))
      return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${roundedAmount}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(accountName)}`
    }

    it('sinh đúng link ảnh VietQR với số tiền, mã đơn hàng và thông tin tài khoản MB Bank', () => {
      const orderCode = 'TTB-20260911-001'
      const total = 299000
      const qrUrl = generateVietQrUrl(orderCode, total)

      expect(qrUrl).toContain('https://img.vietqr.io/image/MB-0335012558-compact2.png')
      expect(qrUrl).toContain('amount=299000')
      expect(qrUrl).toContain('addInfo=TTB%20TTB-20260911-001')
      expect(qrUrl).toContain('accountName=NGUYEN%20HOANG%20TRUONG')
    })
  })
})
