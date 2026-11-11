/** Products shown per page of the home flash-sale carousel. */
export const DEAL_PAGE_SIZE = 5

/**
 * Splits deals into carousel pages of `pageSize`. The last page wraps around to the start of
 * the list so every page is full (legacy carousel behaviour).
 */
export function buildDealPages<T>(items: readonly T[], pageSize: number = DEAL_PAGE_SIZE): T[][] {
  if (!items.length || pageSize <= 0) return []
  const pages: T[][] = []
  for (let i = 0; i < items.length; i += pageSize) {
    const page: T[] = []
    for (let j = 0; j < pageSize; j++) page.push(items[(i + j) % items.length])
    pages.push(page)
  }
  return pages
}

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

/**
 * "Đã bán" progress (0-100) from the product's real `sold` and `stock` counts, or null when
 * either count is missing/invalid or both are zero — the bar is hidden instead of showing a made-up value.
 */
export function getSoldProgress(product: { sold?: unknown; stock?: unknown }): number | null {
  const { sold, stock } = product
  if (!isCount(sold) || !isCount(stock)) return null
  const total = sold + stock
  if (total <= 0) return null
  return Math.min(100, Math.round((sold / total) * 100))
}
