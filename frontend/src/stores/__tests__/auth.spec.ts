import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import { authService } from '@/services/auth.service'

vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
  }
}))

vi.mock('@/router', () => ({
  default: { push: vi.fn() }
}))

describe('Auth Store (FE-01 Auth Hydration)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('initializes with null user and isHydrated=false if localStorage is empty', () => {
    const store = useAuthStore()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.isHydrated).toBe(false)
  })

  it('restores session successfully on hydrateAuth() 200 OK', async () => {
    const mockUser = { _id: 'u123', email: 'user@example.com', role: 'CUSTOMER', fullName: 'Nguyen Van A' }
    vi.mocked(authService.getProfile).mockResolvedValueOnce({ data: { user: mockUser } } as any)

    const store = useAuthStore()
    expect(store.isHydrated).toBe(false)

    const result = await store.hydrateAuth()

    expect(authService.getProfile).toHaveBeenCalledTimes(1)
    expect(result).toEqual(mockUser)
    expect(store.user).toEqual(mockUser)
    expect(store.isAuthenticated).toBe(true)
    expect(store.isHydrated).toBe(true)
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
  })

  it('cleanses state cleanly on hydrateAuth() 401 Unauthorized', async () => {
    vi.mocked(authService.getProfile).mockRejectedValueOnce(new Error('Unauthorized'))

    const store = useAuthStore()
    store.user = { _id: 'stale-user', email: 'old@example.com' } as any
    localStorage.setItem('user', JSON.stringify(store.user))

    const result = await store.hydrateAuth()

    expect(authService.getProfile).toHaveBeenCalledTimes(1)
    expect(result).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.isHydrated).toBe(true)
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('deduplicates concurrent calls to hydrateAuth() into a single request', async () => {
    const mockUser = { _id: 'u999', email: 'dedup@example.com', role: 'ADMIN' }
    vi.mocked(authService.getProfile).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: mockUser } as any), 50))
    )

    const store = useAuthStore()

    // Fire 5 concurrent hydrateAuth calls
    const results = await Promise.all([
      store.hydrateAuth(),
      store.hydrateAuth(),
      store.hydrateAuth(),
      store.hydrateAuth(),
      store.hydrateAuth(),
    ])

    // Exactly 1 call to getProfile
    expect(authService.getProfile).toHaveBeenCalledTimes(1)
    expect(results).toEqual([mockUser, mockUser, mockUser, mockUser, mockUser])
    expect(store.user).toEqual(mockUser)
    expect(store.isHydrated).toBe(true)
  })

  it('updates state on successful login', async () => {
    const mockUser = { id: 1, email: 'test@example.com', role: 'CUSTOMER' }
    const mockResponse = { data: { user: mockUser } }

    vi.mocked(authService.login).mockResolvedValueOnce(mockResponse as any)

    const store = useAuthStore()
    const result = await store.login('test@example.com', 'password')

    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password')
    expect(store.user).toEqual(mockUser)
    expect(store.isAuthenticated).toBe(true)
    expect(store.isHydrated).toBe(true)
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
  })

  it('clears state on logout', async () => {
    const store = useAuthStore()
    store.user = { id: 1, email: 'test@example.com', role: 'CUSTOMER' } as any
    localStorage.setItem('token', 'fake-token')

    vi.mocked(authService.logout).mockResolvedValueOnce({} as any)

    await store.logout()

    expect(authService.logout).toHaveBeenCalled()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
  })
})
