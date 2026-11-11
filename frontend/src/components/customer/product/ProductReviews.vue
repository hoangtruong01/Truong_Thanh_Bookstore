<template>
  <!-- Reviews & Ratings Section -->
  <div class="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-8">
    <div class="flex items-center justify-between border-b border-slate-100 pb-4">
      <div>
        <h2 class="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <span>⭐</span> Đánh giá & Nhận xét từ khách hàng
        </h2>
        <p class="text-xs text-slate-400 mt-0.5 font-medium">Đánh giá trung thực từ người mua hàng thực tế</p>
      </div>
      <button
        v-if="authStore.isAuthenticated"
        class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
        @click="showReviewForm = !showReviewForm"
      >
        {{ showReviewForm ? 'Đóng form' : '+ Viết đánh giá' }}
      </button>
    </div>

    <!-- Rating Stats -->
    <div class="rating-stats-panel grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
      <div class="md:col-span-4 text-center space-y-2 md:border-r border-slate-200/80 py-2">
        <template v-if="hasReviews">
          <div class="text-5xl font-black text-slate-800">{{ summary.averageRating }} <span class="text-2xl text-slate-400 font-medium">/ 5</span></div>
          <div class="flex justify-center gap-1">
            <svg
              v-for="star in 5"
              :key="star"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="w-5 h-5"
              :class="star <= Math.round(summary.averageRating) ? 'text-yellow-500' : 'text-slate-200'"
            >
              <path fill-rule="evenodd" :d="STAR_PATH" clip-rule="evenodd" />
            </svg>
          </div>
          <p class="text-xs text-slate-500 font-bold">Dựa trên {{ summary.totalReviews }} lượt đánh giá</p>
        </template>
        <template v-else>
          <div class="text-2xl font-black text-slate-400" data-testid="no-rating">Chưa có đánh giá</div>
          <div class="flex justify-center gap-1">
            <svg
              v-for="star in 5"
              :key="star"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="w-5 h-5 text-slate-200"
            >
              <path fill-rule="evenodd" :d="STAR_PATH" clip-rule="evenodd" />
            </svg>
          </div>
        </template>
      </div>

      <div class="md:col-span-8 space-y-2">
        <div
          v-for="ratingVal in STAR_LEVELS"
          :key="ratingVal"
          class="flex items-center gap-3 text-xs"
        >
          <span class="w-12 text-right text-slate-600 font-bold flex items-center justify-end gap-1">
            {{ ratingVal }} <span class="text-yellow-500">★</span>
          </span>
          <div class="flex-1 h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              class="h-full bg-yellow-500 rounded-full transition-all duration-500"
              :style="{ width: `${summary.percentages[ratingVal]}%` }"
            ></div>
          </div>
          <span class="w-16 text-slate-500 font-semibold">{{ summary.counts[ratingVal] }} ({{ Math.round(summary.percentages[ratingVal]) }}%)</span>
        </div>
      </div>
    </div>

    <!-- Star Filter Tabs -->
    <div class="flex flex-wrap items-center gap-2 pt-2 border-b border-slate-100 pb-4">
      <span class="text-xs font-bold text-slate-500 mr-2">Lọc theo số sao:</span>
      <button
        class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
        :class="[selectedRatingFilter === null ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
        @click="selectedRatingFilter = null"
      >
        Tất cả ({{ reviews.length }})
      </button>
      <button
        v-for="star in STAR_LEVELS"
        :key="star"
        class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
        :class="[selectedRatingFilter === star ? 'bg-yellow-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
        @click="selectedRatingFilter = star"
      >
        <span>{{ star }}</span>
        <span>★</span>
        <span class="text-[10px] opacity-80">({{ summary.counts[star] }})</span>
      </button>
    </div>

    <!-- Write Review Form -->
    <div v-if="showReviewForm && authStore.isAuthenticated" class="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
      <h3 class="text-sm font-extrabold text-slate-800">Đánh giá của bạn về sản phẩm này</h3>

      <!-- Rating Star Selector -->
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-500 font-medium">Chọn mức đánh giá:</span>
        <div class="flex gap-1.5">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="hover:scale-110 transition-transform focus:outline-none cursor-pointer"
            @click="newReviewRating = star"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="w-7 h-7"
              :class="star <= newReviewRating ? 'text-yellow-500' : 'text-slate-300'"
            >
              <path fill-rule="evenodd" :d="STAR_PATH" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <span class="text-xs font-bold text-yellow-600 ml-2">
          {{ RATING_LABELS[newReviewRating] || 'Rất tệ' }}
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700">Tên hiển thị *</label>
          <input
            v-model="newReviewName"
            type="text"
            placeholder="Nhập họ và tên hiển thị..."
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white text-sm"
          />
        </div>
      </div>

      <div class="space-y-1">
        <label class="text-xs font-bold text-slate-700">Nội dung nhận xét chi tiết *</label>
        <textarea
          v-model="newReviewContent"
          rows="3"
          placeholder="Chia sẻ cảm nhận, chất lượng đóng gói và độ hoàn thiện của sản phẩm..."
          class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white text-sm"
        ></textarea>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button
          type="button"
          class="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
          @click="showReviewForm = false"
        >
          Hủy
        </button>
        <button
          type="button"
          :disabled="isSubmittingReview"
          class="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-xs active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
          @click="submitReview"
        >
          <svg v-if="isSubmittingReview" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá' }}</span>
        </button>
      </div>
    </div>

    <!-- Prompt to Login -->
    <div v-if="!authStore.isAuthenticated" class="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center space-y-3">
      <p class="text-sm font-medium text-slate-600">Quý khách vui lòng đăng nhập tài khoản để gửi đánh giá và nhận xét sản phẩm.</p>
      <router-link to="/login" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer">
        Đăng nhập ngay
      </router-link>
    </div>

    <!-- Reviews List -->
    <div class="space-y-6 divide-y divide-slate-100">
      <div
        v-for="(rev, idx) in displayedReviews"
        :key="rev._id || rev.id || idx"
        class="pt-6 first:pt-0 space-y-3"
      >
        <!-- Regular Mode -->
        <div v-if="editingReviewId !== (rev._id || rev.id)" class="space-y-2">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center font-black text-slate-700 text-sm border border-slate-200">
                {{ rev.name ? rev.name.charAt(0).toUpperCase() : 'U' }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-extrabold text-slate-800">{{ rev.name || 'Khách hàng' }}</h4>
                  <span class="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200/60 px-2 py-0.5 rounded-full">
                    <span>✓</span> Đã mua hàng
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-0.5">
                  <div class="flex gap-0.5">
                    <svg
                      v-for="star in 5"
                      :key="star"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      class="w-3.5 h-3.5"
                      :class="star <= rev.rating ? 'text-yellow-500' : 'text-slate-200'"
                    >
                      <path fill-rule="evenodd" :d="STAR_PATH" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <span class="text-[11px] text-slate-400">• {{ formatReviewDate(rev.createdAt) }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div v-if="canModifyReview(rev)" class="flex items-center gap-1.5">
                <button
                  class="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg cursor-pointer focus:outline-none"
                  @click="startEditReview(rev)"
                >
                  Sửa
                </button>
                <button
                  class="text-xs font-bold text-red-600 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg cursor-pointer focus:outline-none"
                  @click="deleteReview(rev._id || rev.id)"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
          <p class="text-sm text-slate-700 leading-relaxed pl-12">
            {{ rev.content }}
          </p>

          <!-- Admin Reply Badge -->
          <div v-if="rev.adminReply" class="mt-3 ml-12 p-3.5 bg-red-50/60 rounded-xl border border-red-100/80 text-xs space-y-1">
            <div class="flex items-center gap-1.5 font-extrabold text-[#dc2626]">
              <span>💬 Phản hồi từ Cửa hàng Trường Thành</span>
            </div>
            <p class="text-slate-700 font-medium leading-relaxed">{{ rev.adminReply }}</p>
          </div>
        </div>

        <!-- Edit Mode Inline -->
        <div v-else class="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4 pl-12">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-extrabold text-slate-800">Chỉnh sửa đánh giá</h4>
            <!-- Star Rating Selector -->
            <div class="flex items-center gap-1.5">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                class="hover:scale-110 transition-transform focus:outline-none cursor-pointer"
                @click="editReviewRating = star"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="w-5 h-5"
                  :class="star <= editReviewRating ? 'text-yellow-500' : 'text-slate-300'"
                >
                  <path fill-rule="evenodd" :d="STAR_PATH" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Tên hiển thị</label>
              <input
                v-model="editReviewName"
                type="text"
                placeholder="Nhập tên của bạn"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white text-sm"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Nội dung đánh giá</label>
            <textarea
              v-model="editReviewContent"
              rows="2"
              placeholder="Nhập nội dung đánh giá..."
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white text-sm"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-1">
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
              @click="cancelEditReview"
            >
              Hủy
            </button>
            <button
              type="button"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              @click="saveEditReview"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
      <div v-if="displayedReviews.length === 0" class="text-center py-8 text-slate-400 text-sm">
        <span v-if="selectedRatingFilter">Không có đánh giá nào cho mức {{ selectedRatingFilter }} sao.</span>
        <span v-else>Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá!</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { productService } from '@/services/product.service'
import { reviewService } from '@/services/review.service'
import {
  EMPTY_RATING_SUMMARY,
  STAR_LEVELS,
  normalizeRatingBreakdown,
  summarizeReviews,
  type ProductReview,
  type RatingSummary,
} from './reviewSummary'

const props = defineProps<{
  /** Product _id (never the URL slug): reviews are stored against the id. */
  productId: string
}>()

const emit = defineEmits<{
  (e: 'summary-change', summary: RatingSummary): void
}>()

const STAR_PATH =
  'M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z'

const RATING_LABELS: Record<number, string> = {
  5: 'Tuyệt vời',
  4: 'Hài lòng',
  3: 'Bình thường',
  2: 'Không hài lòng',
  1: 'Rất tệ',
}

const authStore = useAuthStore()
const toast = useToast()

const reviews = ref<ProductReview[]>([])
const summary = ref<RatingSummary>(EMPTY_RATING_SUMMARY)
const hasReviews = computed(() => summary.value.totalReviews > 0)

watch(summary, (value) => emit('summary-change', value), { immediate: true })

// ─── Loading ────────────────────────────────────────────────────────────────
let loadToken = 0

/** Rating summary from the backend breakdown endpoint; the displayed list is only a fallback. */
async function refreshSummary(productId: string, token: number) {
  let next: RatingSummary | null = null
  try {
    const res = await reviewService.getBreakdown(productId)
    next = normalizeRatingBreakdown(res.data)
  } catch (err) {
    console.warn('Error loading rating breakdown:', err)
  }
  if (token !== loadToken) return
  summary.value = next ?? summarizeReviews(reviews.value)
}

async function loadReviews(productId: string) {
  const token = ++loadToken
  try {
    const res = await productService.getReviews(productId)
    if (token !== loadToken) return
    reviews.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error('Error loading reviews:', err)
  }
  await refreshSummary(productId, token)
}

function afterMutation() {
  if (props.productId) refreshSummary(props.productId, loadToken)
}

// ─── Filter ─────────────────────────────────────────────────────────────────
const selectedRatingFilter = ref<number | null>(null)
const displayedReviews = computed(() => {
  if (selectedRatingFilter.value === null) return reviews.value
  return reviews.value.filter(r => Math.round(r.rating) === selectedRatingFilter.value)
})

// ─── New review form ────────────────────────────────────────────────────────
const newReviewName = ref('')
const newReviewRating = ref(5)
const newReviewContent = ref('')
const showReviewForm = ref(false)
const isSubmittingReview = ref(false)

watch(showReviewForm, (newVal) => {
  if (newVal && authStore.isAuthenticated && authStore.user) {
    newReviewName.value = authStore.user.fullName || ''
  }
})

async function submitReview() {
  if (isSubmittingReview.value) return
  if (!authStore.isAuthenticated) {
    toast.error('Vui lòng đăng nhập để đánh giá sản phẩm')
    return
  }
  if (!newReviewContent.value.trim()) {
    toast.warning('Vui lòng viết nội dung đánh giá')
    return
  }
  const prodId = props.productId
  if (!prodId) return

  isSubmittingReview.value = true
  try {
    const res = await productService.addReview(prodId, {
      rating: newReviewRating.value,
      content: newReviewContent.value
    })
    reviews.value.unshift(res.data)

    newReviewName.value = ''
    newReviewRating.value = 5
    newReviewContent.value = ''
    showReviewForm.value = false

    toast.success('Cảm ơn bạn đã đánh giá sản phẩm!')
    afterMutation()
  } catch {
    toast.error('Có lỗi xảy ra khi gửi đánh giá')
  } finally {
    isSubmittingReview.value = false
  }
}

// ─── Edit / delete ──────────────────────────────────────────────────────────
const editingReviewId = ref<string | null>(null)
const editReviewName = ref('')
const editReviewRating = ref(5)
const editReviewContent = ref('')

function formatReviewDate(dateStr: any): string {
  if (!dateStr) return ''
  // Support both local format and ISO string
  if (typeof dateStr === 'string' && dateStr.includes('/')) return dateStr
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

function canModifyReview(review: ProductReview): boolean {
  if (authStore.isAdmin) return true

  const currentUserId = authStore.user?._id
  const reviewUserId = review.user || review.userId
  return !!currentUserId && reviewUserId === currentUserId
}

function startEditReview(review: ProductReview) {
  editingReviewId.value = review._id || review.id || null
  editReviewName.value = review.name
  editReviewRating.value = review.rating
  editReviewContent.value = review.content
}

function cancelEditReview() {
  editingReviewId.value = null
  editReviewName.value = ''
  editReviewRating.value = 5
  editReviewContent.value = ''
}

async function saveEditReview() {
  if (!editReviewContent.value.trim()) {
    toast.warning('Vui lòng nhập nội dung đánh giá')
    return
  }

  const prodId = props.productId
  if (!prodId || !editingReviewId.value) return
  try {
    const res = await productService.updateReview(prodId, editingReviewId.value, {
      rating: editReviewRating.value,
      content: editReviewContent.value
    })
    const index = reviews.value.findIndex(r => (r._id || r.id) === editingReviewId.value)
    if (index !== -1) {
      reviews.value[index] = res.data
    }
    toast.success('Đã cập nhật đánh giá!')
    cancelEditReview()
    afterMutation()
  } catch {
    toast.error('Có lỗi xảy ra khi cập nhật đánh giá')
  }
}

async function deleteReview(reviewId?: string) {
  if (!reviewId) return
  const prodId = props.productId
  if (!prodId) return
  try {
    await productService.deleteReview(prodId, reviewId)
    reviews.value = reviews.value.filter(r => (r._id || r.id) !== reviewId)
    toast.success('Đã xóa đánh giá!')
    afterMutation()
  } catch {
    toast.error('Có lỗi xảy ra khi xóa đánh giá')
  }
}

// Declared last: the immediate run touches the filter/edit state defined above.
watch(
  () => props.productId,
  (id) => {
    reviews.value = []
    summary.value = EMPTY_RATING_SUMMARY
    selectedRatingFilter.value = null
    cancelEditReview()
    if (id) loadReviews(id)
  },
  { immediate: true },
)
</script>
