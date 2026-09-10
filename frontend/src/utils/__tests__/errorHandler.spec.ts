import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getFriendlyErrorMessage, showErrorToast, showWarningToast } from '../errorHandler'

const mockToastError = vi.fn()
const mockToastWarning = vi.fn()

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    error: mockToastError,
    warning: mockToastWarning,
  }),
}))

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getFriendlyErrorMessage', () => {
    it('handles timeout error (ECONNABORTED)', () => {
      const error = { code: 'ECONNABORTED' }
      const msg = getFriendlyErrorMessage(error)
      expect(msg).toContain('Timeout')
    })

    it('handles network disconnection error', () => {
      const error = { message: 'Network Error', isAxiosError: true }
      const msg = getFriendlyErrorMessage(error)
      expect(msg).toContain('đường truyền mạng')
    })

    it('maps HTTP 400 with backend message array', () => {
      const error = {
        response: {
          status: 400,
          data: { message: ['Tên không được để trống', 'Giá phải lớn hơn 0'] },
        },
      }
      const msg = getFriendlyErrorMessage(error)
      expect(msg).toBe('Tên không được để trống, Giá phải lớn hơn 0')
    })

    it('maps HTTP 401 to Vietnamese friendly message', () => {
      const error = {
        response: {
          status: 401,
          data: {},
        },
      }
      const msg = getFriendlyErrorMessage(error)
      expect(msg).toContain('hết hạn')
    })

    it('maps HTTP 403 to forbidden message', () => {
      const error = {
        response: {
          status: 403,
          data: {},
        },
      }
      const msg = getFriendlyErrorMessage(error)
      expect(msg).toContain('không có quyền')
    })

    it('maps HTTP 404 to not found message', () => {
      const error = {
        response: {
          status: 404,
          data: {},
        },
      }
      const msg = getFriendlyErrorMessage(error)
      expect(msg).toContain('Không tìm thấy')
    })

    it('maps HTTP 409 to conflict message', () => {
      const error = {
        response: {
          status: 409,
          data: {},
        },
      }
      const msg = getFriendlyErrorMessage(error)
      expect(msg).toContain('trùng lặp')
    })

    it('maps HTTP 413 to file too large message', () => {
      const error = {
        response: {
          status: 413,
          data: {},
        },
      }
      const msg = getFriendlyErrorMessage(error)
      expect(msg).toContain('Kích thước tệp')
    })

    it('maps HTTP 429 to rate limit message', () => {
      const error = {
        response: {
          status: 429,
          data: {},
        },
      }
      const msg = getFriendlyErrorMessage(error)
      expect(msg).toContain('quá nhanh')
    })

    it('maps HTTP 500/502/503/504 to server error message', () => {
      const error500 = { response: { status: 500, data: {} } }
      const error503 = { response: { status: 503, data: {} } }
      expect(getFriendlyErrorMessage(error500)).toContain('bảo trì')
      expect(getFriendlyErrorMessage(error503)).toContain('bảo trì')
    })

    it('returns custom fallback message when error is null or undefined', () => {
      expect(getFriendlyErrorMessage(null, 'Lỗi tùy chọn')).toBe('Lỗi tùy chọn')
      expect(getFriendlyErrorMessage(undefined)).toContain('Đã có lỗi xảy ra')
    })
  })

  describe('showErrorToast and showWarningToast', () => {
    it('triggers toast.error with mapped message', () => {
      const error = { response: { status: 403, data: {} } }
      const msg = showErrorToast(error)

      expect(mockToastError).toHaveBeenCalledWith(msg)
      expect(msg).toContain('không có quyền')
    })

    it('triggers toast.warning with provided message', () => {
      showWarningToast('Cảnh báo số lượng tồn kho thấp')
      expect(mockToastWarning).toHaveBeenCalledWith('Cảnh báo số lượng tồn kho thấp')
    })
  })
})
