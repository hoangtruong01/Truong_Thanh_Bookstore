import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import router from '@/router'

const baseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Bearer token if stored in localStorage (optional fallback for non-cookie auth)
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token')
  if (token && config.headers && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Variables for Silent Token Refresh queue
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => (response.data?.data !== undefined ? response.data : response),
  async (error: AxiosError) => {
    // Handle network errors or server offline
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject({
          message: 'Yêu cầu kết nối quá hạn (Timeout). Vui lòng thử lại.',
        })
      }
      return Promise.reject({
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.',
      })
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const url = originalRequest?.url || ''

    // 401 Unauthorized handling
    if (error.response.status === 401) {
      const isAuthEndpoint =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/refresh') ||
        url.includes('/auth/forgot-password') ||
        url.includes('/auth/reset-password')

      if (isAuthEndpoint) {
        if (url.includes('/auth/refresh')) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.dispatchEvent(new CustomEvent('auth-session-expired'))
          const currentPath = window.location.pathname
          if (currentPath !== '/login' && currentPath !== '/register') {
            router.push({ name: 'Login', query: { redirect: currentPath } })
          }
        }
        return Promise.reject(error.response?.data || error)
      }

      if (!originalRequest._retry) {
        originalRequest._retry = true

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then(() => api(originalRequest))
            .catch((err) => Promise.reject(err))
        }

        isRefreshing = true

        try {
          const storedRefreshToken = localStorage.getItem('refreshToken') || undefined
          const storedAccessToken = localStorage.getItem('token') || undefined
          // Call refresh token endpoint with credentials (cookie) and body payload
          const refreshRes = await axios.post(
            `${baseURL}/auth/refresh`,
            { refreshToken: storedRefreshToken },
            {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
                ...(storedAccessToken ? { Authorization: `Bearer ${storedAccessToken}` } : {}),
              },
            }
          )

          const newAccessToken =
            refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken
          const newRefreshToken =
            refreshRes.data?.data?.refreshToken || refreshRes.data?.refreshToken

          if (newAccessToken) {
            localStorage.setItem('token', newAccessToken)
          }
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken)
          }

          processQueue(null)
          return api(originalRequest)
        } catch (refreshErr) {
          processQueue(refreshErr)
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.dispatchEvent(new CustomEvent('auth-session-expired'))

          const currentPath = window.location.pathname
          if (currentPath !== '/login' && currentPath !== '/register') {
            router.push({ name: 'Login', query: { redirect: currentPath } })
          }
          return Promise.reject(error.response?.data || refreshErr)
        } finally {
          isRefreshing = false
        }

      }
    }

    return Promise.reject(error.response?.data || error)
  }
)

export default api
