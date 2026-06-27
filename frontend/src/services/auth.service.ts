import api from '@/utils/api'

export const authService = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { fullName: string; email: string; password: string; phone?: string }) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data: { fullName?: string; phone?: string; avatar?: string }) => api.put('/auth/profile', data),
}
