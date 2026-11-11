import { describe, it, expect } from 'vitest'
import { normalizeRatingBreakdown, summarizeReviews, EMPTY_RATING_SUMMARY } from '../reviewSummary'

describe('normalizeRatingBreakdown', () => {
  it('maps the backend breakdown payload', () => {
    const summary = normalizeRatingBreakdown({
      averageRating: 4.3,
      totalReviews: 3,
      breakdown: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 1 },
      percentages: { 1: 0, 2: 0, 3: 0, 4: 67, 5: 33 },
    })
    expect(summary).toEqual({
      averageRating: 4.3,
      totalReviews: 3,
      counts: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 1 },
      percentages: { 1: 0, 2: 0, 3: 0, 4: 67, 5: 33 },
    })
  })

  it('accepts string keys and fills missing stars with 0', () => {
    const summary = normalizeRatingBreakdown({
      averageRating: 5,
      totalReviews: 1,
      breakdown: { '5': 1 },
      percentages: { '5': 100 },
    })
    expect(summary?.counts).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 })
    expect(summary?.percentages[5]).toBe(100)
  })

  it('reports a zero average when there are no reviews (never a default 5 stars)', () => {
    const summary = normalizeRatingBreakdown({
      averageRating: 5,
      totalReviews: 0,
      breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    })
    expect(summary?.averageRating).toBe(0)
    expect(summary?.totalReviews).toBe(0)
  })

  it.each([null, undefined, [], 'x', {}, { totalReviews: 2 }, { totalReviews: -1, breakdown: {} }, { totalReviews: 'abc', breakdown: {} }])(
    'returns null for a malformed payload (%j)',
    (payload) => {
      expect(normalizeRatingBreakdown(payload)).toBeNull()
    },
  )
})

describe('summarizeReviews (fallback)', () => {
  it('returns the empty summary for no reviews', () => {
    expect(summarizeReviews([])).toEqual(EMPTY_RATING_SUMMARY)
    expect(summarizeReviews([]).averageRating).toBe(0)
  })

  it('averages to one decimal and buckets per rounded star', () => {
    const summary = summarizeReviews([{ rating: 4 }, { rating: 5 }])
    expect(summary.averageRating).toBe(4.5)
    expect(summary.totalReviews).toBe(2)
    expect(summary.counts).toEqual({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 })
    expect(summary.percentages).toEqual({ 1: 0, 2: 0, 3: 0, 4: 50, 5: 50 })
  })

  it('clamps out-of-range ratings into 1..5 like the backend', () => {
    const summary = summarizeReviews([{ rating: 0 }, { rating: 7 }])
    expect(summary.counts[1]).toBe(1)
    expect(summary.counts[5]).toBe(1)
  })
})
