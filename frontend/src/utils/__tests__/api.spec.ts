import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'
import api from '../api'

vi.mock('@/router', () => ({
  default: {
    currentRoute: {
      value: {
        matched: [{ meta: { requiresAuth: true } }],
        fullPath: '/my-orders',
        name: 'MyOrders',
      },
    },
    push: vi.fn(),
  },
}))

vi.mock('vue-toastification', () => {
  const mockToast = {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  }
  return {
    useToast: () => mockToast,
    createToastInterface: () => mockToast,
  }
})

describe('API Utils - FE-02 Singleton Token Refresh Queue & FE-03 Error Handling', () => {
  let responseErrorHandler: (error: any) => Promise<any>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    // Retrieve the registered response error interceptor from Axios handlers
    const handlers = (api.interceptors.response as any).handlers || []
    expect(handlers.length).toBeGreaterThan(0)
    responseErrorHandler = handlers[handlers.length - 1].rejected
  })

  it('registers response interceptors correctly', () => {
    expect(responseErrorHandler).toBeDefined()
    expect(typeof responseErrorHandler).toBe('function')
  })

  it('deduplicates concurrent 401s so that only ONE POST /auth/refresh is dispatched', async () => {
    let refreshCalls = 0
    const axiosPostSpy = vi.spyOn(axios, 'post').mockImplementation(async (url: string) => {
      if (typeof url === 'string' && url.includes('/auth/refresh')) {
        refreshCalls++
        await new Promise((r) => setTimeout(r, 40))
        return { status: 200, data: { success: true } }
      }
      return { status: 200, data: {} }
    })

    // Mock api call re-execution adapter
    api.defaults.adapter = async () => ({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config: {} as any })

    const create401Error = (id: number) => ({
      config: { url: `/items/${id}`, headers: {} },
      response: { status: 401, data: { message: 'Unauthorized' } },
    })

    // Fire 5 concurrent 401 errors through the interceptor
    const p1 = responseErrorHandler(create401Error(1))
    const p2 = responseErrorHandler(create401Error(2))
    const p3 = responseErrorHandler(create401Error(3))
    const p4 = responseErrorHandler(create401Error(4))
    const p5 = responseErrorHandler(create401Error(5))

    await Promise.allSettled([p1, p2, p3, p4, p5])

    // Crucial check for FE-02: Exactly 1 refresh call was made despite 5 simultaneous 401 errors
    expect(refreshCalls).toBe(1)
    expect(axiosPostSpy).toHaveBeenCalledTimes(1)
  })

  it('clears session and dispatches auth-session-expired if refresh fails', async () => {
    vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Refresh Token Revoked'))

    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
    localStorage.setItem('user', JSON.stringify({ id: 1 }))

    const error = {
      config: { url: '/user/profile', headers: {} },
      response: { status: 401, data: { message: 'Token expired' } },
    }

    await expect(responseErrorHandler(error)).rejects.toBeDefined()

    expect(localStorage.getItem('user')).toBeNull()
    expect(dispatchEventSpy).toHaveBeenCalled()
    const dispatchedEvent = dispatchEventSpy.mock.calls.find(
      (c) => (c[0] as CustomEvent).type === 'auth-session-expired'
    )
    expect(dispatchedEvent).toBeDefined()
  })

  it('does not attempt to refresh for auth endpoints like /auth/login or /auth/refresh', async () => {
    const axiosPostSpy = vi.spyOn(axios, 'post')
    const error = {
      config: { url: '/auth/login', headers: {} },
      response: { status: 401, data: { message: 'Wrong credentials' } },
    }

    await expect(responseErrorHandler(error)).rejects.toEqual({ message: 'Wrong credentials' })
    expect(axiosPostSpy).not.toHaveBeenCalled()
  })

  it('handles network offline / timeout errors with standard messaging', async () => {
    const networkError = {
      config: { url: '/products', headers: {} },
      response: undefined,
      code: 'ERR_NETWORK',
    }

    await expect(responseErrorHandler(networkError)).rejects.toMatchObject({
      isNetworkError: true,
      isTimeout: false,
    })
  })
})
