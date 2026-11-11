/** Static copy and keyword lists for the storefront header search (SearchAutocomplete). */

export const SEARCH_HISTORY_KEY = 'search_history'
export const SEARCH_HISTORY_LIMIT = 8

/** Shown when a search result has no image. */
export const PRODUCT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100'

export const POPULAR_SEARCHES: readonly string[] = [
  'Bút Thiên Long',
  'Sổ Hồng Hà',
  'Máy tính Casio',
  'Giấy in Double A',
  'Bút sáp Deli',
]

export const DEFAULT_SUGGESTIONS: readonly string[] = ['bút', 'sổ tay', 'giấy A4', 'kẹp giấy', 'bút bi', 'thước kẻ']

export const COMMON_KEYWORDS: readonly string[] = [
  'bút bi',
  'bút gel',
  'bút ký',
  'bút chì',
  'bút dạ quang',
  'bút lông',
  'bút sáp màu',
  'bút máy',
  'sổ tay',
  'sổ lò xo',
  'sổ da',
  'giấy A4',
  'giấy note',
  'giấy vẽ',
  'kẹp bướm',
  'bìa hồ sơ',
  'thước kẻ',
  'gôm tẩy',
  'hộp bút',
  'keo dán',
  'kéo cắt giấy',
  'máy tính casio',
]

/** Lower-case and strip Vietnamese diacritics so "but" matches "bút". */
export function normalizeSearchText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
}
