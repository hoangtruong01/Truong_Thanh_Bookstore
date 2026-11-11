<template>
  <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Breadcrumb -->
    <Breadcrumb :items="breadcrumbItems" />

    <SkeletonLoader v-if="loading" type="product-detail" />

    <EmptyState
      v-else-if="!product"
      icon="🔍"
      title="Không tìm thấy sản phẩm"
      description="Sản phẩm bạn đang tìm kiếm có thể đã bị xóa hoặc không còn khả dụng trên hệ thống."
      action-text="Trở về danh sách sản phẩm"
      action-to="/products"
    />

    <div v-else class="space-y-12">
      <!-- Product Main Grid -->
      <div class="bg-white border border-slate-200 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-2 gap-12 shadow-xs">
        <!-- Gallery (+ lightbox) -->
        <ProductGallery :images="product.images" :product-name="product.name" />

        <!-- Meta and Actions -->
        <ProductPurchasePanel
          :product="product"
          :category-detail="categoryDetail"
          :average-rating="reviewSummary.averageRating"
          :review-count="reviewSummary.totalReviews"
          @open-policy="activePolicy = $event"
        />
      </div>

      <!-- Description Block -->
      <div class="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
        <h2 class="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-4 mb-6">Mô tả sản phẩm</h2>
        <div
          class="prose max-w-none text-slate-600 text-sm leading-relaxed"
          v-html="parseMarkdown(product.description || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.')"
        ></div>
      </div>

      <!-- Product Specifications Block -->
      <ProductSpecsTable :product="product" />

      <!-- Reviews & Ratings Section (reviews are keyed by _id, never the URL slug) -->
      <ProductReviews :product-id="product._id" @summary-change="reviewSummary = $event" />

      <!-- Recommended / Related Products -->
      <RelatedProducts :products="relatedProducts" :category="product.category" @add-to-cart="addRelatedToCart" />
    </div>

    <!-- Policy Detail Modal -->
    <PolicyModal :policy="activePolicy" @close="activePolicy = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import { parseMarkdown } from '@/utils/helpers'
import { getCategoryPath, categoryPathToBreadcrumbs } from '@/utils/category'
import type { Product, Category } from '@/types'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import EmptyState from '@/components/EmptyState.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import ProductGallery from '@/components/customer/product/ProductGallery.vue'
import ProductPurchasePanel from '@/components/customer/product/ProductPurchasePanel.vue'
import ProductSpecsTable from '@/components/customer/product/ProductSpecsTable.vue'
import ProductReviews from '@/components/customer/product/ProductReviews.vue'
import RelatedProducts from '@/components/customer/product/RelatedProducts.vue'
import PolicyModal, { type PolicyKey } from '@/components/customer/product/PolicyModal.vue'
import { EMPTY_RATING_SUMMARY, type RatingSummary } from '@/components/customer/product/reviewSummary'
import { useSeoMeta, INDEX_ROBOTS, NOINDEX_ROBOTS } from '@/composables/useSeoMeta'
import { useProductSchema, useBreadcrumbSchema } from '@/composables/useStructuredData'
import { buildCanonicalUrl, toMetaDescription } from '@/utils/seo'

const route = useRoute()
const cartStore = useCartStore()
const toast = useToast()

const product = ref<Product | null>(null)
const relatedProducts = ref<Product[]>([])
const loading = ref(true)
const categoryDetail = ref<Category | null>(null)
const allCategories = ref<Category[]>([])
const activePolicy = ref<PolicyKey | null>(null)
/** Rating summary reported by <ProductReviews> (backend breakdown endpoint). */
const reviewSummary = ref<RatingSummary>(EMPTY_RATING_SUMMARY)

const breadcrumbItems = computed(() => {
  const items = [
    { label: 'Trang chủ', to: '/' },
    { label: 'Sản phẩm', to: '/products' }
  ]
  if (product.value) {
    const catId = typeof product.value.category === 'object' && product.value.category
      ? (product.value.category as any)._id
      : (product.value.category || (categoryDetail.value ? categoryDetail.value._id : ''))

    if (catId && allCategories.value.length > 0) {
      // Build ancestry path from root down to this category (TT-012)
      items.push(...categoryPathToBreadcrumbs(getCategoryPath(allCategories.value, String(catId))))
    } else if (typeof product.value.category === 'object' && product.value.category) {
      items.push({
        label: (product.value.category as any).name,
        to: `/products?category=${(product.value.category as any)._id}`
      })
    } else if (categoryDetail.value) {
      items.push({
        label: categoryDetail.value.name,
        to: `/products?category=${categoryDetail.value._id}`
      })
    }
    items.push({
      label: product.value.name,
      to: `/products/${product.value.slug || product.value._id}`
    })
  }
  return items
})

// SEO-TASK-003/004/007: metadata + JSON-LD dùng dữ liệu thật của sản phẩm
const productCanonicalUrl = computed(() => {
  const prodSlug = product.value?.slug || product.value?._id
  return prodSlug ? buildCanonicalUrl(`/products/${prodSlug}`) : undefined
})

// Không index khi: đang tải, không tìm thấy (soft-404) hoặc sản phẩm ngừng kinh doanh (INACTIVE)
const productIndexable = computed(() =>
  !loading.value && !!product.value && product.value.status !== 'INACTIVE',
)

useSeoMeta(() => {
  const p = product.value
  const fallbackDescription = p
    ? `Mua ${p.name} chính hãng tại Trường Thành Stationery. Giao hàng toàn quốc, đổi trả linh hoạt.`
    : undefined
  return {
    title: p?.name || (loading.value ? 'Chi tiết sản phẩm' : 'Không tìm thấy sản phẩm'),
    description: toMetaDescription(p?.description) || fallbackDescription,
    ogImage: p?.images?.[0] || '',
    ogType: p ? 'product' : 'website',
    canonical: productCanonicalUrl.value,
    robots: productIndexable.value ? INDEX_ROBOTS : NOINDEX_ROBOTS,
  }
})

useProductSchema(() => {
  const p = product.value
  if (!p || !productIndexable.value || !productCanonicalUrl.value) return null
  return {
    name: p.name,
    description: p.description,
    images: p.images,
    sku: p.sku,
    brand: p.brand,
    price: p.price,
    discountPrice: p.discountPrice,
    stock: p.stock,
    status: p.status,
    url: productCanonicalUrl.value,
    // Rating = đúng con số đang hiển thị (tóm tắt đánh giá của trang), không dùng product.rating
    ratingValue: reviewSummary.value.averageRating,
    reviewCount: reviewSummary.value.totalReviews,
    productType: p.productType,
    isbn: p.isbn,
    author: p.author,
    publisher: p.publisher,
    pages: p.pages,
    language: p.language,
  }
})

useBreadcrumbSchema(() =>
  productIndexable.value
    ? breadcrumbItems.value.map((item) => ({ name: item.label, url: item.to }))
    : [],
)

async function loadProduct() {
  loading.value = true
  categoryDetail.value = null
  reviewSummary.value = EMPTY_RATING_SUMMARY
  try {
    const id = route.params.id as string
    const res = await productService.getById(id)
    product.value = res.data

    // De-couple main page loader so users can view & purchase the product immediately (UX Optimization)
    // Reviews are loaded by <ProductReviews> once it mounts with product._id.
    loading.value = false

    // Fetch category detail asynchronously to check for combo/bundle info
    const catId = typeof res.data.category === 'object' && res.data.category ? res.data.category._id : res.data.category
    if (catId) {
      categoryService.getById(catId).then(catRes => {
        categoryDetail.value = catRes.data
      }).catch(err => {
        console.error('Error loading category detail for combo:', err)
      })
    }

    // Fetch related products using dedicated getRelated API with fallback
    productService.getRelated(res.data._id, 10).then((relatedRes: any) => {
      const items = Array.isArray(relatedRes.data) ? relatedRes.data : (relatedRes.data?.data || [])
      relatedProducts.value = items.filter((p: Product) => p._id !== res.data._id)
    }).catch(err => {
      console.warn('Fallback fetching related products via getAll:', err)
      productService.getAll({ category: catId, limit: 11 }).then((fallbackRes: any) => {
        const items = Array.isArray(fallbackRes.data) ? fallbackRes.data : (fallbackRes.data?.data || [])
        relatedProducts.value = items.filter((p: Product) => p._id !== res.data._id)
      })
    })
  } catch {
    // SEO-TASK-007: không giữ dữ liệu sản phẩm trước (tránh canonical/JSON-LD sai) => hiển thị trạng thái "không tìm thấy" + noindex
    product.value = null
    relatedProducts.value = []
    reviewSummary.value = EMPTY_RATING_SUMMARY
    toast.error('Lỗi khi tải chi tiết sản phẩm')
    loading.value = false
  }
}

onMounted(() => {
  loadProduct()
  categoryService.getAll().then((res: any) => {
    const raw = res.data?.data || res.data || []
    allCategories.value = Array.isArray(raw) ? raw : []
  }).catch(() => {})
})
watch(() => route.params.id, () => {
  loadProduct()
})

// Quick add (qty 1) from a related product card
const isAddingRelated = ref(false)
function addRelatedToCart(prod: Product) {
  if (isAddingRelated.value) return
  isAddingRelated.value = true
  try {
    cartStore.addToCart(prod, 1)
    toast.success(`Đã thêm "${prod.name}" vào giỏ hàng`)
  } finally {
    setTimeout(() => {
      isAddingRelated.value = false
    }, 500)
  }
}
</script>
