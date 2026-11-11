import { describe, it, expect } from 'vitest'
import { buildProductSchema, buildBreadcrumbSchema, displayedPrice, type ProductSchemaInput } from '../useStructuredData'
import { SITE_URL } from '@/utils/seo'

const base: ProductSchemaInput = {
  name: 'Bút bi Thiên Long TL-027',
  sku: 'TL027',
  price: 5000,
  stock: 10,
  status: 'ACTIVE',
  url: `${SITE_URL}/products/but-bi-thien-long-tl-027`,
}

describe('buildProductSchema (SEO-TASK-004)', () => {
  it('returns null when required data is missing or price is invalid', () => {
    expect(buildProductSchema(null)).toBeNull()
    expect(buildProductSchema({ ...base, name: '' })).toBeNull()
    expect(buildProductSchema({ ...base, sku: '' })).toBeNull()
    expect(buildProductSchema({ ...base, price: 0 })).toBeNull()
  })

  it('does not emit schema for discontinued (INACTIVE) products', () => {
    expect(buildProductSchema({ ...base, status: 'INACTIVE' })).toBeNull()
  })

  it('never fabricates aggregateRating: requires visible reviews (count > 0)', () => {
    expect(buildProductSchema({ ...base, ratingValue: 5, reviewCount: 0 })!.aggregateRating).toBeUndefined()
    expect(buildProductSchema({ ...base, ratingValue: 0, reviewCount: 3 })!.aggregateRating).toBeUndefined()
    const withReviews = buildProductSchema({ ...base, ratingValue: 4.3, reviewCount: 3 })!
    expect(withReviews.aggregateRating).toMatchObject({ ratingValue: 4.3, reviewCount: 3 })
  })

  it('never fabricates a brand when brand is empty', () => {
    expect(buildProductSchema({ ...base, brand: '' })!.brand).toBeUndefined()
    expect(buildProductSchema({ ...base, brand: 'Thiên Long' })!.brand).toEqual({ '@type': 'Brand', name: 'Thiên Long' })
  })

  it('uses the displayed price (discount only when 0 < discount < price)', () => {
    expect(buildProductSchema({ ...base, discountPrice: 4000 })!.offers.price).toBe(4000)
    expect(buildProductSchema({ ...base, discountPrice: 0 })!.offers.price).toBe(5000)
    expect(buildProductSchema({ ...base, discountPrice: 6000 })!.offers.price).toBe(5000)
    expect(displayedPrice(5000, 5000)).toBe(5000)
  })

  it('maps availability from stock and OUT_OF_STOCK status, with offer url + condition', () => {
    const inStock = buildProductSchema(base)!
    expect(inStock.offers).toMatchObject({
      availability: 'https://schema.org/InStock',
      priceCurrency: 'VND',
      url: base.url,
      itemCondition: 'https://schema.org/NewCondition',
    })
    expect(buildProductSchema({ ...base, stock: 0 })!.offers.availability).toBe('https://schema.org/OutOfStock')
    expect(buildProductSchema({ ...base, status: 'OUT_OF_STOCK', stock: 5 })!.offers.availability).toBe(
      'https://schema.org/OutOfStock',
    )
  })

  it('emits absolute image URLs and drops base64 data URIs', () => {
    const schema = buildProductSchema({ ...base, images: ['/uploads/a.jpg', 'data:image/png;base64,AAA', 'https://cdn.x/b.jpg'] })!
    expect(schema.image).toEqual([`${SITE_URL}/uploads/a.jpg`, 'https://cdn.x/b.jpg'])
    expect(buildProductSchema({ ...base, images: ['data:image/png;base64,AAA'] })!.image).toBeUndefined()
  })

  it('strips markdown from description', () => {
    expect(buildProductSchema({ ...base, description: '**Mực** _đều_' })!.description).toBe('Mực đều')
  })

  it('describes books as Product + Book with real ISBN/author/publisher data', () => {
    const schema = buildProductSchema({
      ...base,
      productType: 'BOOK',
      isbn: '978-604-1-12345-6',
      author: 'Nguyễn Nhật Ánh',
      publisher: 'NXB Trẻ',
      pages: 250,
      language: 'Tiếng Việt',
    })!
    expect(schema['@type']).toEqual(['Product', 'Book'])
    expect(schema).toMatchObject({
      isbn: '978-604-1-12345-6',
      gtin13: '9786041123456',
      author: { '@type': 'Person', name: 'Nguyễn Nhật Ánh' },
      publisher: { '@type': 'Organization', name: 'NXB Trẻ' },
      numberOfPages: 250,
      inLanguage: 'Tiếng Việt',
    })
  })

  it('keeps stationery as plain Product without book fields', () => {
    const schema = buildProductSchema({ ...base, productType: 'STATIONERY', author: 'x' })!
    expect(schema['@type']).toBe('Product')
    expect(schema.author).toBeUndefined()
  })
})

describe('buildBreadcrumbSchema', () => {
  it('requires at least 2 items', () => {
    expect(buildBreadcrumbSchema([{ name: 'Trang chủ', url: '/' }])).toBeNull()
  })

  it('builds absolute item URLs with positions', () => {
    const schema = buildBreadcrumbSchema([
      { name: 'Trang chủ', url: '/' },
      { name: 'Sản phẩm', url: '/products' },
      { name: 'Bút bi', url: '/products/but-bi' },
    ])!
    expect(schema.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Sản phẩm', item: `${SITE_URL}/products` },
      { '@type': 'ListItem', position: 3, name: 'Bút bi', item: `${SITE_URL}/products/but-bi` },
    ])
  })
})
