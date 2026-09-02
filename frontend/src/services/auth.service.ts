import api from '@/utils/api'

export const authService = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { fullName: string; email: string; password: string; phone?: string }) => api.post('/auth/register', data),
  refreshToken: () => api.post('/auth/refresh', {}),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data: { fullName?: string; phone?: string; avatar?: string }) => api.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/auth/change-password', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  verifyOtp: (email: string, otp: string) => api.post('/auth/verify-otp', { email, otp }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
  logout: () => api.post('/auth/logout', {}),
}
