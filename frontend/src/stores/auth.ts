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
  const isHydrated = ref(false)
  const isHydrating = ref(false)
  let hydrationPromise: Promise<User | null> | null = null

  const isAuthenticated = computed(() => !!user.value)
  const isSuperAdmin = computed(() => user.value?.role === 'SUPER_ADMIN')
  const isAdmin = computed(() => user.value?.role === 'ADMIN' || user.value?.role === 'SUPER_ADMIN')
  const isStaff = computed(() => user.value?.role === 'STAFF' || user.value?.role === 'ADMIN' || user.value?.role === 'SUPER_ADMIN')

  async function hydrateAuth(): Promise<User | null> {
    if (isHydrated.value) return user.value
    if (hydrationPromise) return hydrationPromise

    isHydrating.value = true
    hydrationPromise = (async () => {
      try {
        const res = await authService.getProfile()
        const raw = res.data?.data || res.data
        const userData = raw?.user || raw
        if (userData && (userData._id || userData.id || userData.email)) {
          user.value = userData
          localStorage.setItem('user', JSON.stringify(userData))
        } else if (!getStoredUser()) {
          clearSession()
        }
      } catch (err: any) {
        // Only clear session if server explicitly rejected authentication with 401 / Unauthorized.
        // Network glitches, offline mode, or temporary 5xx errors should never destroy existing session.
        const is401 =
          err?.response?.status === 401 ||
          err?.status === 401 ||
          err?.message === 'Unauthorized' ||
          err?.errorCode === 'ERR_UNAUTHORIZED' ||
          err?.response?.data?.errorCode === 'ERR_UNAUTHORIZED'

        if (is401) {
          clearSession()
        }
      } finally {
        isHydrated.value = true
        isHydrating.value = false
        hydrationPromise = null
      }
      return user.value
    })()

    return hydrationPromise
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const res = await authService.login(email, password)
      const data = res.data?.data || res.data
      user.value = data.user
      isHydrated.value = true
      localStorage.setItem('user', JSON.stringify(user.value))
      return data
    } finally {
      loading.value = false
    }
  }

  async function register(data: any) {
    loading.value = true
    try {
      const res = await authService.register(data)
      const responseData = res.data?.data || res.data
      user.value = responseData.user
      isHydrated.value = true
      localStorage.setItem('user', JSON.stringify(user.value))
      return responseData
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    try {
      const res = await authService.getProfile()
      const userData = res.data?.data || res.data
      user.value = userData
      isHydrated.value = true
      localStorage.setItem('user', JSON.stringify(user.value))
      return user.value
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
    // Remove tokens left by releases before the HttpOnly-cookie migration.
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
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
    if (!isAuthenticated.value) return false
    try {
      const res = await userService.toggleWishlist(productId)
      const updatedList = res.data.wishlist || res.data
      if (user.value) {
        user.value.wishlist = updatedList
        localStorage.setItem('user', JSON.stringify(user.value))
      }
      return true
    } catch (e) {
      console.error('Failed to toggle wishlist:', e)
      return false
    }
  }

  async function refreshSession() {
    try {
      const res = await authService.refreshToken()
      if (res.data?.user) {
        user.value = res.data.user
        localStorage.setItem('user', JSON.stringify(user.value))
      }
      return res.data
    } catch (e) {
      clearSession()
      throw e
    }
  }

  return {
    user,
    loading,
    isHydrated,
    isHydrating,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isStaff,
    initAuth,
    login,
    register,
    fetchProfile,
    updateProfile,
    refreshSession,
    logout,
    clearSession,
    toggleWishlist,
    isHydrated,
    isHydrating,
    hydrateAuth,
  }
})
