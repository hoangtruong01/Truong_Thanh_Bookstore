import { onMounted, onUnmounted } from 'vue'

const SCRIPT_ID_PREFIX = 'structured-data-'

/**
 * Composable to inject JSON-LD structured data for Google Rich Results.
 * Automatically cleans up on unmount.
 *
 * @example
 * useStructuredData('product', {
 *   "@context": "https://schema.org",
 *   "@type": "Product",
 *   name: "Bút bi Thiên Long TL-027",
 *   ...
 * })
 */
export function useStructuredData(id: string, data: Record<string, any> | (() => Record<string, any>)) {
  const scriptId = SCRIPT_ID_PREFIX + id

  function inject() {
    // Remove existing
    const existing = document.getElementById(scriptId)
    if (existing) existing.remove()

    const resolved = typeof data === 'function' ? data() : data
    if (!resolved || Object.keys(resolved).length === 0) return

    const script = document.createElement('script')
    script.id = scriptId
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(resolved)
    document.head.appendChild(script)
  }

  function cleanup() {
    const el = document.getElementById(scriptId)
    if (el) el.remove()
  }

  onMounted(inject)
  onUnmounted(cleanup)
}

/**
 * Pre-built Organization schema for the store homepage.
 */
export function useOrganizationSchema() {
  useStructuredData('organization', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Trường Thành Stationery',
    alternateName: 'Văn Phòng Phẩm Trường Thành',
    url: 'https://truong-thanh-store.vercel.app',
    logo: 'https://truong-thanh-store.vercel.app/favicon.svg',
    description: 'Hệ thống cung cấp dụng cụ học tập và văn phòng phẩm chất lượng cao tại Việt Nam.',
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
}

/**
 * Pre-built Product schema for product detail pages.
 */
export function useProductSchema(product: {
  name: string
  description?: string
  image?: string
  sku: string
  brand?: string
  price: number
  discountPrice?: number
  stock: number
  rating?: number
  reviewCount?: number
  url?: string
}) {
  useStructuredData('product', () => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: product.image || '',
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Trường Thành',
    },
    offers: {
      '@type': 'Offer',
      price: (product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price),
      priceCurrency: 'VND',
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Trường Thành Stationery',
      },
    },
    ...(product.rating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount || 0,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
    url: product.url || window.location.href,
  }))
}

/**
 * Pre-built BreadcrumbList schema.
 */
export function useBreadcrumbSchema(items: { name: string; url: string }[]) {
  useStructuredData('breadcrumb', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  })
}
