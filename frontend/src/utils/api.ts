import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import router from '@/router'
import { showErrorToast, showWarningToast, showSuccessToast } from '@/utils/errorHandler'

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipGlobalErrorHandler?: boolean
    skipAuthRedirect?: boolean
  }
}

const baseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

// Listen to browser online/offline status
if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    showWarningToast('Mất kết nối Internet. Vui lòng kiểm tra lại đường truyền mạng.')
  })
  window.addEventListener('online', () => {
    showSuccessToast('Đã khôi phục kết nối Internet.')
  })
}

// Singleton Refresh Promise for Axios Queue (FE-02)
let refreshPromise: Promise<any> | null = null
let isRedirectingToLogin = false

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => (response.data?.data !== undefined ? response.data : response),
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & {
      _retry?: boolean
      skipGlobalErrorHandler?: boolean
      skipAuthRedirect?: boolean
    }) | undefined

    const url = originalRequest?.url || ''

    // 1. Handle network errors or server offline
    if (!error.response) {
      if (!originalRequest?.skipGlobalErrorHandler) {
        showErrorToast(error)
      }
      return Promise.reject(error)
    }

    // 2. Handle HTTP 401 Unauthorized
    if (error.response.status === 401) {
      const isAuthEndpoint =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/refresh') ||
        url.includes('/auth/forgot-password') ||
        url.includes('/auth/reset-password')

      // If already an auth endpoint, do not attempt to refresh
      if (isAuthEndpoint) {
        if (url.includes('/auth/refresh')) {
          localStorage.removeItem('user')
          window.dispatchEvent(new CustomEvent('auth-session-expired'))
          handleSessionExpiredRedirect(originalRequest?.skipAuthRedirect)
        }
        if (!originalRequest?.skipGlobalErrorHandler && !originalRequest?.skipAuthRedirect && !url.includes('/auth/refresh')) {
          showErrorToast(error)
        }
        return Promise.reject(error.response?.data || error)
      }

      // If not retried yet, trigger token refresh queue
      if (originalRequest && !originalRequest._retry) {
        originalRequest._retry = true

        // Create singleton refresh promise if one is not already in-flight
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
          await refreshPromise
          // Retry the original failed request with the newly refreshed cookie session
          return api(originalRequest)
        } catch (refreshErr: any) {
          localStorage.removeItem('user')
          window.dispatchEvent(new CustomEvent('auth-session-expired'))
          handleSessionExpiredRedirect(originalRequest.skipAuthRedirect)
          return Promise.reject(error.response?.data || refreshErr)
        }
      }
    }

    // 3. Global Error Toast for other HTTP error codes (FE-03)
    if (!originalRequest?.skipGlobalErrorHandler) {
      showErrorToast(error)
    }

    return Promise.reject(error.response?.data || error)
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
