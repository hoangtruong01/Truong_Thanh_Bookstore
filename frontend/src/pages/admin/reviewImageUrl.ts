/**
 * SEC-002: chỉ cho phép URL http/https khi hiển thị hoặc mở ảnh đánh giá.
 * Trả về URL đã chuẩn hóa, hoặc null nếu không an toàn (javascript:, data:, ...).
 */
export function toSafeHttpUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  if (!value) return null
  try {
    const parsed = new URL(value)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
    return null
  } catch {
    return null
  }
}

export function safeReviewImages(images: unknown): string[] {
  if (!Array.isArray(images)) return []
  return images
    .map((img) => toSafeHttpUrl(img))
    .filter((url): url is string => url !== null)
}
