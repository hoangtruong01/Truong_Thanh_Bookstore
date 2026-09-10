import { useToast } from 'vue-toastification'

export interface ApiErrorResponse {
  statusCode?: number
  message?: string | string[]
  error?: string
  timestamp?: string
  path?: string
}

let toastInstance: ReturnType<typeof useToast> | null = null

function getToast() {
  if (!toastInstance) {
    try {
      toastInstance = useToast()
    } catch {
      // Return null if toast container isn't mounted yet
      return null
    }
  }
  return toastInstance
}

/**
 * Extracts a user-friendly Vietnamese error message from an Axios error or generic error
 */
export function getFriendlyErrorMessage(error: any, fallbackMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.'): string {
  if (!error) return fallbackMessage

  // Handle Axios timeout or Network failure
  if (error.code === 'ECONNABORTED') {
    return 'Yêu cầu kết nối quá hạn (Timeout). Vui lòng thử lại.'
  }
  if (!error.response && (error.message === 'Network Error' || error.isAxiosError)) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.'
  }

  const response = error.response
  const data: ApiErrorResponse | undefined = response?.data
  const status = response?.status

  // If backend provided a specific message
  let backendMsg = ''
  if (data?.message) {
    if (Array.isArray(data.message)) {
      backendMsg = data.message.join(', ')
    } else if (typeof data.message === 'string') {
      backendMsg = data.message
    }
  }

  switch (status) {
    case 400:
      return backendMsg || 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.'
    case 401:
      return backendMsg || 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.'
    case 403:
      return backendMsg || 'Bạn không có quyền thực hiện thao tác này.'
    case 404:
      return backendMsg || 'Không tìm thấy dữ liệu hoặc trang yêu cầu.'
    case 409:
      return backendMsg || 'Dữ liệu bị trùng lặp hoặc xảy ra xung đột trạng thái.'
    case 413:
      return 'Kích thước tệp hoặc dữ liệu gửi lên quá lớn (vượt quá giới hạn cho phép).'
    case 422:
      return backendMsg || 'Dữ liệu không đáp ứng điều kiện xử lý.'
    case 429:
      return 'Bạn đang thao tác quá nhanh. Vui lòng chờ trong giây lát rồi thử lại.'
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Hệ thống đang gặp sự cố hoặc đang bảo trì. Đội ngũ kỹ thuật đang xử lý.'
    default:
      if (backendMsg) return backendMsg
      if (typeof error.message === 'string' && error.message) {
        return error.message
      }
      return fallbackMessage
  }
}

/**
 * Shows an error toast notification with human-friendly message
 */
export function showErrorToast(error: any, fallbackMessage?: string) {
  const toast = getToast()
  const msg = getFriendlyErrorMessage(error, fallbackMessage)
  if (toast) {
    toast.error(msg)
  }
  return msg
}

/**
 * Shows a warning toast notification
 */
export function showWarningToast(message: string) {
  const toast = getToast()
  if (toast) {
    toast.warning(message)
  }
}

/**
 * Shows a success toast notification
 */
export function showSuccessToast(message: string) {
  const toast = getToast()
  if (toast) {
    toast.success(message)
  }
}
