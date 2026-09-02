import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import { authService } from '@/services/auth.service'

vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
  }
}))

vi.mock('@/router', () => ({
  default: { push: vi.fn() }
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('initializes with null user if localStorage is empty', () => {
    const store = useAuthStore()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('updates state on successful login', async () => {
    const mockUser = { id: 1, email: 'test@example.com', role: 'CUSTOMER' }
    const mockResponse = { data: { user: mockUser } }
    
    // @ts-ignore
    authService.login.mockResolvedValueOnce(mockResponse)
    
    const store = useAuthStore()
    const result = await store.login('test@example.com', 'password')
    
    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password')
    expect(store.user).toEqual(mockUser)
    expect(store.isAuthenticated).toBe(true)
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })

  it('clears state on logout', async () => {
    const store = useAuthStore()
    store.user = { id: 1, email: 'test@example.com', role: 'CUSTOMER' } as any
    localStorage.setItem('token', 'fake-token')
    
    // @ts-ignore
    authService.logout.mockResolvedValueOnce({})
    
    await store.logout()
    
    expect(authService.logout).toHaveBeenCalled()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
  })
})
