import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import { authService } from '@/services/auth.service'

vi.mock('@/services/auth.service', () => ({
  authService: {
    getProfile: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }
}))

vi.mock('@/router', () => ({
  default: { push: vi.fn() }
}))

describe('Auth Hydration (FE-01)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('hydrates user session successfully on initAuth when /auth/me returns valid user', async () => {
    const mockUser = { _id: 'u123', email: 'user@truongthanh.vn', role: 'CUSTOMER', fullName: 'Nguyen Van A' }
    // @ts-ignore
    authService.getProfile.mockResolvedValueOnce({ data: mockUser })

    const store = useAuthStore()
    expect(store.isHydrated).toBe(false)

    const isAuthed = await store.initAuth()

    expect(isAuthed).toBe(true)
    expect(store.isHydrated).toBe(true)
    expect(store.user).toEqual(mockUser)
    expect(store.isAuthenticated).toBe(true)
    expect(authService.getProfile).toHaveBeenCalledWith({
      skipGlobalErrorHandler: true,
      skipAuthRedirect: true,
    })
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
  })

  it('handles guest session (401 or null) gracefully without throwing or redirecting', async () => {
    // @ts-ignore
    authService.getProfile.mockRejectedValueOnce({
      response: { status: 401, data: { message: 'Unauthorized' } }
    })

    const store = useAuthStore()
    const isAuthed = await store.initAuth()

    expect(isAuthed).toBe(false)
    expect(store.isHydrated).toBe(true)
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('is idempotent: subsequent calls return immediately without duplicate network calls', async () => {
    const mockUser = { _id: 'u456', email: 'admin@truongthanh.vn', role: 'ADMIN' }
    // @ts-ignore
    authService.getProfile.mockResolvedValueOnce({ data: mockUser })

    const store = useAuthStore()
    await store.initAuth()
    expect(authService.getProfile).toHaveBeenCalledTimes(1)

    // Second call should return immediately
    const isAuthed2 = await store.initAuth()
    expect(isAuthed2).toBe(true)
    expect(authService.getProfile).toHaveBeenCalledTimes(1)
  })

  it('shares a singleton promise when multiple concurrent initAuth() are triggered', async () => {
    const mockUser = { _id: 'u789', email: 'staff@truongthanh.vn', role: 'STAFF' }
    let resolver: any
    const delayedPromise = new Promise((resolve) => {
      resolver = resolve
    })

    // @ts-ignore
    authService.getProfile.mockReturnValueOnce(delayedPromise)

    const store = useAuthStore()
    const p1 = store.initAuth()
    const p2 = store.initAuth()

    // Resolve now
    resolver({ data: mockUser })

    const [res1, res2] = await Promise.all([p1, p2])

    expect(res1).toBe(true)
    expect(res2).toBe(true)
    expect(authService.getProfile).toHaveBeenCalledTimes(1)
  })
})
