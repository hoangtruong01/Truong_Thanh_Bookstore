import { describe, it, expect } from 'vitest'
import { toSafeHttpUrl, safeReviewImages } from './reviewImageUrl'

describe('reviewImageUrl (SEC-002)', () => {
  it.each([
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(1)',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    'vbscript:msgbox(1)',
    'ftp://example.com/a.jpg',
    '/relative.jpg',
    '',
    '   ',
  ])('rejects %s', (bad) => {
    expect(toSafeHttpUrl(bad)).toBeNull()
  })

  it('rejects non-string values', () => {
    expect(toSafeHttpUrl(null)).toBeNull()
    expect(toSafeHttpUrl(undefined)).toBeNull()
    expect(toSafeHttpUrl(123)).toBeNull()
  })

  it('accepts http and https URLs', () => {
    expect(toSafeHttpUrl('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg')
    expect(toSafeHttpUrl('http://localhost:3000/b.png')).toBe('http://localhost:3000/b.png')
  })

  it('safeReviewImages filters out unsafe entries and non-arrays', () => {
    expect(
      safeReviewImages(['https://cdn.example.com/a.jpg', 'javascript:alert(1)', 'data:image/png;base64,AAAA']),
    ).toEqual(['https://cdn.example.com/a.jpg'])
    expect(safeReviewImages(undefined)).toEqual([])
    expect(safeReviewImages('javascript:alert(1)')).toEqual([])
  })
})
