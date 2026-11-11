export interface ProductReview {
  _id?: string
  id?: string
  user?: string
  userId?: string
  name: string
  rating: number
  content: string
  createdAt: string
  isVerifiedPurchase?: boolean
  adminReply?: string
  adminReplyAt?: string
  images?: string[]
}

export type StarLevel = 1 | 2 | 3 | 4 | 5

export const STAR_LEVELS: readonly StarLevel[] = [5, 4, 3, 2, 1]

/** Rating summary shown on the product page (average, total and per-star split). */
export interface RatingSummary {
  averageRating: number
  totalReviews: number
  counts: Record<StarLevel, number>
  /** Whole-number percentages per star, as returned by the backend. */
  percentages: Record<StarLevel, number>
}

export const EMPTY_RATING_SUMMARY: RatingSummary = Object.freeze({
  averageRating: 0,
  totalReviews: 0,
  counts: Object.freeze({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }),
  percentages: Object.freeze({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }),
}) as RatingSummary

function toCount(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * Normalises the payload of GET /reviews/product/:id/breakdown
 * (`{ averageRating, totalReviews, breakdown, percentages }`).
 * Returns null when the payload is not in that shape so the caller can fall back.
 */
export function normalizeRatingBreakdown(payload: unknown): RatingSummary | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const data = payload as Record<string, any>
  const total = Number(data.totalReviews)
  if (!Number.isFinite(total) || total < 0) return null
  const breakdown = data.breakdown && typeof data.breakdown === 'object' ? data.breakdown : null
  if (!breakdown) return null
  const pct = data.percentages && typeof data.percentages === 'object' ? data.percentages : {}

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<StarLevel, number>
  const percentages = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<StarLevel, number>
  for (const star of STAR_LEVELS) {
    counts[star] = toCount(breakdown[star])
    percentages[star] = total > 0 ? toCount(pct[star]) : 0
  }
  const average = Number(data.averageRating)
  return {
    averageRating: total > 0 && Number.isFinite(average) ? average : 0,
    totalReviews: total,
    counts,
    percentages,
  }
}

/**
 * Fallback used only when the breakdown endpoint is unavailable: summarises the
 * review list that is already displayed, with the same rounding as the backend.
 */
export function summarizeReviews(reviews: readonly Pick<ProductReview, 'rating'>[]): RatingSummary {
  const total = reviews.length
  if (total === 0) return EMPTY_RATING_SUMMARY
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<StarLevel, number>
  let sum = 0
  for (const r of reviews) {
    const star = Math.max(1, Math.min(5, Math.round(r.rating))) as StarLevel
    counts[star]++
    sum += r.rating
  }
  const percentages = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<StarLevel, number>
  for (const star of STAR_LEVELS) percentages[star] = Math.round((counts[star] / total) * 100)
  return {
    averageRating: Math.round((sum / total) * 10) / 10,
    totalReviews: total,
    counts,
    percentages,
  }
}
