import { describe, it, expect } from 'vitest'
import frontendVercelJson from '../../../vercel.json'

describe('FRONT-P2-01: Frontend Security Headers & Content Security Policy', () => {
  it('frontend/vercel.json defines comprehensive security headers including CSP', () => {
    const config = frontendVercelJson as any
    expect(config.headers).toBeDefined()
    expect(config.headers.length).toBeGreaterThan(0)

    const globalHeaders = config.headers.find((h: any) => h.source === '/(.*)')
    expect(globalHeaders).toBeDefined()

    const headersMap = new Map<string, string>(
      globalHeaders.headers.map((item: any) => [item.key, item.value]),
    )

    expect(headersMap.get('X-Content-Type-Options')).toBe('nosniff')
    expect(headersMap.get('X-Frame-Options')).toBe('DENY')
    expect(headersMap.get('X-XSS-Protection')).toBe('1; mode=block')
    expect(headersMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(headersMap.get('Strict-Transport-Security')).toContain('max-age=31536000')

    const csp = headersMap.get('Content-Security-Policy')
    expect(csp).toBeDefined()
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain('fonts.googleapis.com')
  })
})
