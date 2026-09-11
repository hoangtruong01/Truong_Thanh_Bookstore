import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useToast, createToastInterface } from 'vue-toastification'
import router from '@/router'

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipGlobalErrorHandler?: boolean
    skipAuthRedirect?: boolean
  }
}

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

const toastThrottleMap = new Map<string, number>()
function showThrottledToast(msg: string, type: 'error' | 'warning' = 'error', cooldownMs = 3000) {
  const now = Date.now()
  const lastTime = toastThrottleMap.get(msg) || 0
  if (now - lastTime < cooldownMs) {
    return
  }
  toastThrottleMap.set(msg, now)
  const toast = getToast()
  if (type === 'warning') {
    toast?.warning(msg)
  } else {
    toast?.error(msg)
  }
}

function notifySessionExpired() {
  showThrottledToast('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'error', 4000)
}

// Singleton Refresh Promise for Axios Queue (FE-02)
let isRedirectingToLogin = false

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => (response.data?.data !== undefined ? response.data : response),
  async (error: AxiosError) => {
    const originalRequest = (error.config || {}) as CustomRequestConfig
    const skipGlobalToast = originalRequest.skipGlobalToast || originalRequest.skipGlobalErrorHandler
    const url = originalRequest.url || ''

    // 1. Handle network errors or server offline
    if (!error.response) {
      const isTimeout = error.code === 'ECONNABORTED'
      const errorMsg = isTimeout
        ? 'Yêu cầu kết nối quá hạn (Timeout). Vui lòng thử lại.'
        : 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.'

      if (!skipGlobalToast) {
        showThrottledToast(errorMsg, 'error', 3000)
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
        url.includes('/auth/reset-password') ||
        url.includes('/auth/verify-otp')

      // If already an auth endpoint, do not attempt to refresh
      if (isAuthEndpoint) {
        if (url.includes('/auth/refresh')) {
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.dispatchEvent(new CustomEvent('auth-session-expired'))
          if (!skipGlobalToast) notifySessionExpired()
          handleSessionExpiredRedirect(originalRequest.skipAuthRedirect)
        }
        return Promise.reject(errorData || error)
      }

      // If not retried yet, trigger token refresh queue
      if (originalRequest && !originalRequest._retry) {
        originalRequest._retry = true

        // Create singleton refresh promise if not already in flight
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              `${baseURL}/auth/refresh`,
              {},
              {
                withCredentials: true,
                timeout: 15000,
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
          // An unavailable server does not prove that the session was revoked.
          if (![401, 403].includes(refreshErr?.response?.status)) {
            return Promise.reject(refreshErr)
          }
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.dispatchEvent(new CustomEvent('auth-session-expired'))

          if (!skipGlobalToast) {
            notifySessionExpired()
          }

          handleSessionExpiredRedirect(originalRequest.skipAuthRedirect)

          return Promise.reject(errorData || refreshErr)
        }
      }
    }

    // 3. FE-03: Global HTTP Error UX handling
    if (!skipGlobalToast) {
      if (status === 400) {
        const msg = extractErrorMessage(errorData) || 'Dữ liệu yêu cầu không hợp lệ.'
        showThrottledToast(msg, 'warning', 1500)
      } else if (status === 403) {
        showThrottledToast('Bạn không có quyền thực hiện thao tác này.', 'error', 3000)
      } else if (status === 429) {
        showThrottledToast('Bạn đang thao tác quá nhanh. Vui lòng thử lại sau ít phút!', 'warning', 3000)
      } else if (status >= 500) {
        showThrottledToast('Đã có lỗi xảy ra từ hệ thống. Đội ngũ kỹ thuật đang xử lý.', 'error', 3000)
      }
    }

    return Promise.reject(errorData || error)
  }
)

/**
 * Gracefully redirects to Login only when the user is on a protected route
 */
function handleSessionExpiredRedirect(skipAuthRedirect?: boolean) {
  if (skipAuthRedirect || isRedirectingToLogin) return

  const currentRoute = router.currentRoute.value
  const isProtectedRoute = currentRoute.matched.some(
    (record) => record.meta.requiresAuth || record.meta.requiresAdmin
  )

  if (isProtectedRoute) {
    isRedirectingToLogin = true
    setTimeout(() => {
      isRedirectingToLogin = false
    }, 1500)

    const fullPath = currentRoute.fullPath || window.location.pathname
    if (!fullPath.startsWith('/login') && !fullPath.startsWith('/register')) {
      router.push({ name: 'Login', query: { redirect: fullPath } })
    }
  }
}

export default api
