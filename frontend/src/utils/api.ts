import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useToast, createToastInterface } from 'vue-toastification'
import router from '@/router'

const baseURL = import.meta.env.VITE_API_URL || '/api'

export interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
  skipGlobalToast?: boolean
}

const api = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

function getToast() {
  try {
    return useToast()
  } catch {
    try {
      return createToastInterface()
    } catch {
      return null
    }
  }
}

function extractErrorMessage(data: any): string {
  if (!data) return ''
  if (typeof data === 'string') return data
  if (typeof data.message === 'string') return data.message
  if (Array.isArray(data.message)) {
    return data.message.filter((m: any) => typeof m === 'string').join('; ')
  }
  if (Array.isArray(data.details)) {
    return data.details.filter((m: any) => typeof m === 'string').join('; ')
  }
  return ''
}

// Variables for FE-02 Singleton Silent Token Refresh Queue
let refreshPromise: Promise<any> | null = null
let hasNotifiedExpired = false

function notifySessionExpired() {
  if (hasNotifiedExpired) return
  hasNotifiedExpired = true
  setTimeout(() => {
    hasNotifiedExpired = false
  }, 3000)

  const toast = getToast()
  toast?.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.')
}

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => (response.data?.data !== undefined ? response.data : response),
  async (error: AxiosError) => {
    const originalRequest = (error.config || {}) as CustomRequestConfig
    const url = originalRequest.url || ''
    const toast = getToast()

    // 1. Handle network errors or server offline
    if (!error.response) {
      const isTimeout = error.code === 'ECONNABORTED'
      const errorMsg = isTimeout
        ? 'Yêu cầu kết nối quá hạn (Timeout). Vui lòng thử lại.'
        : 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.'

      if (!originalRequest.skipGlobalToast) {
        toast?.error(errorMsg)
      }

      return Promise.reject({
        message: errorMsg,
        isNetworkError: true,
        isTimeout,
      })
    }

    const status = error.response.status
    const errorData = error.response.data

    // 2. FE-02: 401 Unauthorized handling with Singleton Refresh Promise
    if (status === 401) {
      const isAuthEndpoint =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/refresh') ||
        url.includes('/auth/forgot-password') ||
        url.includes('/auth/reset-password')

      if (isAuthEndpoint) {
        if (url.includes('/auth/refresh')) {
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.dispatchEvent(new CustomEvent('auth-session-expired'))
          notifySessionExpired()

          const currentRoute = router.currentRoute.value
          const requiresAuth = currentRoute?.matched?.some(
            (r) => r.meta?.requiresAuth || r.meta?.requiresAdmin
          )
          if (requiresAuth && currentRoute.name !== 'Login' && currentRoute.name !== 'Register') {
            router.push({ name: 'Login', query: { redirect: currentRoute.fullPath } })
          }
        }
        return Promise.reject(errorData || error)
      }

      if (!originalRequest._retry) {
        originalRequest._retry = true

        // Create singleton refresh promise if not already in flight
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              `${baseURL}/auth/refresh`,
              {},
              {
                withCredentials: true,
                headers: {
                  'Content-Type': 'application/json',
                  'X-Requested-With': 'XMLHttpRequest',
                },
              }
            )
            .finally(() => {
              refreshPromise = null
            })
        }

        try {
          // All concurrent 401 requests await the exact same refresh promise
          await refreshPromise
          return api(originalRequest)
        } catch (refreshErr: any) {
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.dispatchEvent(new CustomEvent('auth-session-expired'))

          if (!originalRequest.skipGlobalToast) {
            notifySessionExpired()
          }

          const currentRoute = router.currentRoute.value
          const requiresAuth = currentRoute?.matched?.some(
            (r) => r.meta?.requiresAuth || r.meta?.requiresAdmin
          )
          if (requiresAuth && currentRoute.name !== 'Login' && currentRoute.name !== 'Register') {
            router.push({ name: 'Login', query: { redirect: currentRoute.fullPath } })
          }

          return Promise.reject(errorData || refreshErr)
        }
      }
    }

    // 3. FE-03: Global HTTP Error UX handling
    if (!originalRequest.skipGlobalToast) {
      if (status === 400) {
        const msg = extractErrorMessage(errorData) || 'Dữ liệu yêu cầu không hợp lệ.'
        toast?.warning(msg)
      } else if (status === 403) {
        toast?.error('Bạn không có quyền thực hiện thao tác này.')
      } else if (status === 429) {
        toast?.warning('Bạn đang thao tác quá nhanh. Vui lòng thử lại sau ít phút!')
      } else if (status >= 500) {
        toast?.error('Đã có lỗi xảy ra từ hệ thống. Đội ngũ kỹ thuật đang xử lý.')
      }
    }

    return Promise.reject(errorData || error)
  }
)

export default api
