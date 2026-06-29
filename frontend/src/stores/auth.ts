import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'
import { encryptToken, decryptToken } from '@/utils/helpers'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const getStoredUser = (): User | null => {
    const rawUser = localStorage.getItem('user')
    const decrypted = decryptToken(rawUser)
    try {
      return decrypted ? JSON.parse(decrypted) : null
    } catch {
      return null
    }
  }

  const user = ref<User | null>(getStoredUser())
  const token = ref<string | null>(decryptToken(localStorage.getItem('token')))
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isStaff = computed(() => user.value?.role === 'STAFF' || user.value?.role === 'ADMIN')

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const res = await authService.login(email, password)
      user.value = res.data.user
      token.value = res.data.accessToken
      localStorage.setItem('token', encryptToken(token.value!))
      localStorage.setItem('user', encryptToken(JSON.stringify(user.value)))
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function register(data: any) {
    loading.value = true
    try {
      const res = await authService.register(data)
      user.value = res.data.user
      token.value = res.data.accessToken
      localStorage.setItem('token', encryptToken(token.value!))
      localStorage.setItem('user', encryptToken(JSON.stringify(user.value)))
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    try {
      const res = await authService.getProfile()
      user.value = res.data
      localStorage.setItem('user', encryptToken(JSON.stringify(user.value)))
    } catch (e) {
      logout()
    }
  }

  async function updateProfile(data: { fullName?: string; phone?: string; avatar?: string }) {
    loading.value = true
    try {
      const res = await authService.updateProfile(data)
      user.value = res.data
      localStorage.setItem('user', encryptToken(JSON.stringify(user.value)))
      return res.data
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    isStaff,
    login,
    register,
    fetchProfile,
    updateProfile,
    logout
  }
})
