import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'
import { userService } from '@/services/user.service'
import { decodeLegacyStorage } from '@/utils/helpers'
import router from '@/router'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const getStoredUser = (): User | null => {
    const rawUser = localStorage.getItem('user')
    const decrypted = decodeLegacyStorage(rawUser)
    try {
      return decrypted ? JSON.parse(decrypted) : null
    } catch {
      return null
    }
  }

  const user = ref<User | null>(getStoredUser())
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isSuperAdmin = computed(() => user.value?.role === 'SUPER_ADMIN')
  const isAdmin = computed(() => user.value?.role === 'ADMIN' || user.value?.role === 'SUPER_ADMIN')
  const isStaff = computed(() => user.value?.role === 'STAFF' || user.value?.role === 'ADMIN' || user.value?.role === 'SUPER_ADMIN')

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const res = await authService.login(email, password)
      user.value = res.data.user
      localStorage.removeItem('token')
      localStorage.setItem('user', JSON.stringify(user.value))
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
      localStorage.removeItem('token')
      localStorage.setItem('user', JSON.stringify(user.value))
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    try {
      const res = await authService.getProfile()
      user.value = res.data
      localStorage.setItem('user', JSON.stringify(user.value))
    } catch (e) {
      clearSession()
      throw e
    }
  }

  async function updateProfile(data: { fullName?: string; phone?: string; avatar?: string }) {
    loading.value = true
    try {
      const res = await authService.updateProfile(data)
      user.value = res.data
      localStorage.setItem('user', JSON.stringify(user.value))
      return res.data
    } finally {
      loading.value = false
    }
  }

  // FIX-2.2: Use Vue Router instead of window.location to prevent full page reload
  function clearSession() {
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function logout() {
    try {
      await authService.logout()
    } finally {
      clearSession()
    }
    router.push({ name: 'Login' })
  }

  async function toggleWishlist(productId: string) {
    if (!isAuthenticated.value) return false;
    try {
      const res = await userService.toggleWishlist(productId);
      const updatedList = res.data.wishlist || res.data;
      if (user.value) {
        user.value.wishlist = updatedList;
        localStorage.setItem('user', JSON.stringify(user.value));
      }
      return true;
    } catch (e) {
      console.error('Failed to toggle wishlist:', e);
      return false;
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isStaff,
    login,
    register,
    fetchProfile,
    updateProfile,
    logout,
    clearSession,
    toggleWishlist
  }
})
