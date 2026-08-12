import axios from 'axios'
import router from '@/router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response.data?.data !== undefined ? response.data : response,
  (error) => {
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

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.dispatchEvent(new CustomEvent('auth-session-expired'))
      // BUG-04: Use Vue Router instead of window.location to avoid state loss and flash
      const currentPath = window.location.pathname
      if (currentPath !== '/login' && currentPath !== '/register') {
        router.push({ name: 'Login', query: { redirect: currentPath } })
      }
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default api
