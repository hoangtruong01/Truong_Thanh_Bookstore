import { onMounted, onUnmounted, watch } from 'vue'
import { SITE_URL, SITE_NAME, absoluteUrl, toMetaDescription } from '@/utils/seo'

const SCRIPT_ID_PREFIX = 'structured-data-'

type JsonLd = Record<string, any>

function injectJsonLd(scriptId: string, resolved: JsonLd | null | undefined) {
  document.getElementById(scriptId)?.remove()
  if (!resolved || Object.keys(resolved).length === 0) return

  const script = document.createElement('script')
  script.id = scriptId
  script.type = 'application/ld+json'
  // Escape "<" để nội dung (tên/mô tả sản phẩm) không thể đóng thẻ </script>
  script.textContent = JSON.stringify(resolved).replace(/</g, '\\u003c')
  document.head.appendChild(script)
}

/**
 * Composable to inject JSON-LD structured data for Google Rich Results.
 * Trả về {} / null => gỡ script (vd. dữ liệu chưa tải xong hoặc trang không hợp lệ).
 * Automatically cleans up on unmount.
 */
export function useStructuredData(id: string, data: JsonLd | (() => JsonLd | null)) {
  const scriptId = SCRIPT_ID_PREFIX + id
  const resolve = () => (typeof data === 'function' ? data() : data)

  onMounted(() => injectJsonLd(scriptId, resolve()))
  onUnmounted(() => document.getElementById(scriptId)?.remove())
  if (typeof data === 'function') {
    watch(data, (value) => injectJsonLd(scriptId, value), { deep: true })
  }
}

/**
 * Organization + WebSite schema cho trang chủ (giúp Google hiểu tên site & thương hiệu).
 */
export function useOrganizationSchema() {
  useStructuredData('organization', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    alternateName: 'Văn Phòng Phẩm Trường Thành',
    url: SITE_URL,
    logo: absoluteUrl('/logo.jpg'),
    description: 'Hệ thống cung cấp sách, dụng cụ học tập và văn phòng phẩm tại Việt Nam.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Chợ chanh - Nhân Hà',
      addressLocality: 'Ninh Bình',
      addressCountry: 'VN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+84982938316',
      contactType: 'customer service',
      availableLanguage: 'Vietnamese',
    },
    sameAs: [
      'https://www.facebook.com/profile.php?id=61589787305540',
      'https://zalo.me/0982938316',
    ],
  })
  useStructuredData('website', {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    inLanguage: 'vi-VN',
  })
}

export interface ProductSchemaInput {
  name: string
  description?: string
  images?: string[]
  sku: string
  brand?: string
  price: number
  discountPrice?: number
  stock: number
  status?: string
  url: string
  /** Điểm trung bình của các review ĐANG HIỂN THỊ trên trang (không dùng product.rating). */
  ratingValue?: number
  /** Số review ĐANG HIỂN THỊ trên trang. aggregateRating chỉ xuất khi > 0. */
  reviewCount?: number
  productType?: string
  isbn?: string
  author?: string
  publisher?: string
  pages?: number
  language?: string
}

/** Giá đang hiển thị cho khách: giá giảm chỉ áp dụng khi 0 < discountPrice < price (giống template PDP). */
export function displayedPrice(price: number, discountPrice?: number): number {
  return discountPrice && discountPrice > 0 && discountPrice < price ? discountPrice : price
}

/**
 * Dựng Product (+ Book) JSON-LD từ dữ liệu thật. Trả về null nếu không đủ điều kiện:
 * thiếu tên/SKU/giá, hoặc sản phẩm ngừng kinh doanh (INACTIVE).
 * Không bịa brand, rating hay review.
 */
export function buildProductSchema(p: ProductSchemaInput | null | undefined): JsonLd | null {
  if (!p || !p.name || !p.sku || !(p.price > 0)) return null
  if (p.status && p.status !== 'ACTIVE' && p.status !== 'OUT_OF_STOCK') return null

  const images = (p.images || []).map((img) => absoluteUrl(img)).filter(Boolean)
  const inStock = p.status !== 'OUT_OF_STOCK' && p.stock > 0
  const isbnDigits = (p.isbn || '').replace(/[^0-9Xx]/g, '')
  const isBook = p.productType === 'BOOK' && !!(p.isbn || p.author)

  const schema: JsonLd = {
    '@context': 'https://schema.org',
    '@type': isBook ? ['Product', 'Book'] : 'Product',
    name: p.name,
    sku: p.sku,
    url: p.url,
    offers: {
      '@type': 'Offer',
      url: p.url,
      price: displayedPrice(p.price, p.discountPrice),
      priceCurrency: 'VND',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
  }

  const description = toMetaDescription(p.description, 5000)
  if (description) schema.description = description
  if (images.length) schema.image = images
  if (p.brand && p.brand.trim()) schema.brand = { '@type': 'Brand', name: p.brand.trim() }
  if (/^\d{13}$/.test(isbnDigits)) schema.gtin13 = isbnDigits

  if (isBook) {
    if (p.isbn) schema.isbn = p.isbn
    if (p.author) schema.author = { '@type': 'Person', name: p.author }
    if (p.publisher) schema.publisher = { '@type': 'Organization', name: p.publisher }
    if (p.pages && p.pages > 0) schema.numberOfPages = p.pages
    if (p.language) schema.inLanguage = p.language
  }

  if (p.reviewCount && p.reviewCount > 0 && p.ratingValue && p.ratingValue > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: p.ratingValue,
      reviewCount: p.reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return schema
}

/**
 * Product schema cho trang chi tiết sản phẩm (reactive getter).
 */
export function useProductSchema(getProduct: () => ProductSchemaInput | null) {
  useStructuredData('product', () => buildProductSchema(getProduct()))
}

export interface BreadcrumbSchemaItem {
  name: string
  /** Path nội bộ hoặc URL tuyệt đối. Bỏ trống cho mục cuối (trang hiện tại). */
  url?: string
}

export function buildBreadcrumbSchema(items: BreadcrumbSchemaItem[]): JsonLd | null {
  const valid = items.filter((item) => item && item.name)
  if (valid.length < 2) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: valid.map((item, index) => {
      const entry: JsonLd = { '@type': 'ListItem', position: index + 1, name: item.name }
      const url = absoluteUrl(item.url)
      if (url) entry.item = url
      return entry
    }),
  }
}

/**
 * BreadcrumbList schema (reactive getter hoặc mảng tĩnh).
 */
export function useBreadcrumbSchema(items: BreadcrumbSchemaItem[] | (() => BreadcrumbSchemaItem[])) {
  useStructuredData('breadcrumb', () =>
    buildBreadcrumbSchema(typeof items === 'function' ? items() : items),
  )
}
