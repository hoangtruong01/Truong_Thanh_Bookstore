<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
      <div>
        <h1 class="text-xl font-black text-slate-900 uppercase tracking-tight">
          Kiểm duyệt Đánh giá Sản phẩm
        </h1>
        <p class="text-xs text-slate-500 mt-1">
          Quản lý, phản hồi và kiểm duyệt các đánh giá từ khách hàng đã mua sách & văn phòng phẩm
        </p>
      </div>
      <button
        type="button"
        @click="fetchReviews"
        class="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
      >
        <span>🔄</span>
        <span>Làm mới</span>
      </button>
    </div>

    <!-- FilterBar -->
    <FilterBar
      v-model="filters.search"
      placeholder="Tìm theo tên khách hoặc nội dung đánh giá..."
      @search="handleSearch"
    >
      <template #filters>
        <!-- Rating Filter -->
        <select
          v-model="filters.rating"
          @change="handleFilterChange"
          class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
        >
          <option :value="undefined">Tất cả mức sao</option>
          <option :value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
          <option :value="4">⭐⭐⭐⭐ (4 sao)</option>
          <option :value="3">⭐⭐⭐ (3 sao)</option>
          <option :value="2">⭐⭐ (2 sao)</option>
          <option :value="1">⭐ (1 sao)</option>
        </select>

        <!-- Visibility Filter -->
        <select
          v-model="filters.isVisible"
          @change="handleFilterChange"
          class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
        >
          <option :value="undefined">Tất cả trạng thái</option>
          <option :value="true">Đang hiển thị</option>
          <option :value="false">Đã ẩn (vi phạm)</option>
        </select>
      </template>
    </FilterBar>

    <!-- Reviews DataTable -->
    <DataTable
      :columns="columns"
      :items="reviews"
      :loading="loading"
      pagination
      :current-page="currentPage"
      :total-items="total"
      :page-size="filters.limit"
      empty-text="Không tìm thấy đánh giá nào."
      empty-subtext="Chưa có đánh giá nào phù hợp với bộ lọc hiện tại."
      @page-change="changePage"
    >
      <!-- Product Column -->
      <template #cell(product)="{ row }">
        <div class="flex items-center gap-3 max-w-[220px]">
          <img
            :src="row.product?.images?.[0] || 'https://placehold.co/80x80/f1f5f9/94a3b8?text=Book'"
            class="w-10 h-10 object-cover rounded-lg border border-slate-200 flex-shrink-0"
          />
          <div class="min-w-0">
            <p class="font-bold text-slate-900 truncate leading-tight">{{ row.product?.name || 'Sản phẩm' }}</p>
            <p class="text-[10px] text-slate-400 font-mono mt-0.5">ID: {{ (row.product?._id || '').slice(-6) }}</p>
          </div>
        </div>
      </template>

      <!-- Customer Column -->
      <template #cell(customer)="{ row }">
        <div>
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-slate-800">{{ row.name }}</span>
            <span
              v-if="row.isVerifiedPurchase"
              class="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-full font-bold border border-emerald-200"
              title="Khách hàng đã mua sản phẩm này"
            >
              ✓ Đã mua
            </span>
          </div>
          <p class="text-[10px] text-slate-400 mt-0.5">{{ formatDate(row.createdAt) }}</p>
        </div>
      </template>

      <!-- Rating Column -->
      <template #cell(rating)="{ row }">
        <div>
          <div class="flex items-center text-amber-400 text-xs">
            <span v-for="s in 5" :key="s">{{ s <= row.rating ? '★' : '☆' }}</span>
          </div>
          <span class="text-[10px] font-extrabold text-slate-600 mt-0.5 block">{{ row.rating }}/5 sao</span>
        </div>
      </template>

      <!-- Content Column -->
      <template #cell(content)="{ row }">
        <div class="space-y-1.5 max-w-sm">
          <p class="text-slate-800 leading-relaxed">{{ row.content }}</p>

          <!-- Review Images -->
          <div v-if="row.images && row.images.length > 0" class="flex gap-1.5 mt-1">
            <img
              v-for="(img, idx) in row.images"
              :key="idx"
              :src="img"
              class="w-8 h-8 rounded object-cover border border-slate-200 cursor-pointer"
              @click="previewImage(img)"
            />
          </div>

          <!-- Store Reply Display -->
          <div v-if="row.adminReply" class="bg-red-50/60 border-l-2 border-[#dc2626] p-2 rounded-r-lg text-[11px] text-slate-700 mt-1">
            <p class="font-bold text-[#dc2626] text-[10px]">Phản hồi từ Nhà sách:</p>
            <p class="mt-0.5 italic">{{ row.adminReply }}</p>
          </div>
        </div>
      </template>

      <!-- Status Column -->
      <template #cell(status)="{ row }">
        <StatusBadge
          :status="row.isVisible !== false ? 'ACTIVE' : 'INACTIVE'"
          :label="row.isVisible !== false ? 'Đang hiển thị' : 'Đã ẩn (vi phạm)'"
        />
      </template>

      <!-- Actions Column -->
      <template #cell(actions)="{ row }">
        <div class="flex items-center justify-end gap-2">
          <!-- Toggle visibility button -->
          <button
            type="button"
            @click="toggleVisibility(row)"
            :class="[
              row.isVisible !== false ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700',
              'font-bold cursor-pointer'
            ]"
          >
            {{ row.isVisible !== false ? 'Ẩn' : 'Hiện' }}
          </button>

          <!-- Reply button -->
          <button
            type="button"
            @click="openReplyModal(row)"
            class="text-[#dc2626] hover:text-[#b91c1c] font-bold cursor-pointer"
          >
            {{ row.adminReply ? 'Sửa trả lời' : 'Trả lời' }}
          </button>

          <!-- Delete button -->
          <button
            type="button"
            @click="confirmDelete(row)"
            class="text-slate-400 hover:text-red-600 font-bold cursor-pointer"
          >
            Xóa
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Reply FormModal -->
    <FormModal
      v-model="showReplyModal"
      :title="`Phản hồi đánh giá của ${selectedReview?.name || ''}`"
      confirm-text="Gửi phản hồi"
      cancel-text="Hủy"
      :loading="submittingReply"
      @confirm="submitReply"
    >
      <div class="space-y-4">
        <p class="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl italic border border-slate-100">
          "{{ selectedReview?.content }}"
        </p>
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-700">Nội dung phản hồi từ Cửa hàng:</label>
          <textarea
            v-model="replyText"
            rows="4"
            placeholder="Nhập nội dung phản hồi chân thành đến khách hàng..."
            class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
          ></textarea>
        </div>
      </div>
    </FormModal>

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :isOpen="showDeleteModal"
      title="Xóa đánh giá này?"
      message="Hành động này sẽ xóa vĩnh viễn đánh giá và tính toán lại điểm trung bình cho sản phẩm."
      variant="danger"
      @confirm="submitDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { reviewService, type ReviewQuery } from '@/services/review.service'
import { formatDate } from '@/utils/helpers'
import { useToast } from 'vue-toastification'
import FilterBar from '@/components/FilterBar.vue'
import DataTable, { type TableColumn } from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import FormModal from '@/components/FormModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

const toast = useToast()
const reviews = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const loading = ref(true)
const submittingReply = ref(false)

const filters = reactive<ReviewQuery>({
  page: 1,
  limit: 10,
  search: '',
  rating: undefined,
  isVisible: undefined,
})

const columns: TableColumn[] = [
  { key: 'product', label: 'SẢN PHẨM' },
  { key: 'customer', label: 'KHÁCH HÀNG' },
  { key: 'rating', label: 'ĐÁNH GIÁ' },
  { key: 'content', label: 'NỘI DUNG' },
  { key: 'status', label: 'TRẠNG THÁI' },
  { key: 'actions', label: 'THAO TÁC', align: 'right' },
]

const showReplyModal = ref(false)
const showDeleteModal = ref(false)
const selectedReview = ref<any>(null)
const replyText = ref('')

async function fetchReviews() {
  loading.value = true
  try {
    const res = await reviewService.getAllAdmin({
      page: filters.page,
      limit: filters.limit,
      search: filters.search || undefined,
      rating: filters.rating,
      isVisible: filters.isVisible,
    })
    const data = res.data?.data || res.data || {}
    reviews.value = data.items || []
    total.value = data.total || 0
    currentPage.value = data.page || 1
  } catch (err: any) {
    toast.error('Không thể tải danh sách đánh giá')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  filters.page = 1
  fetchReviews()
}

function handleFilterChange() {
  filters.page = 1
  fetchReviews()
}

function changePage(page: number) {
  filters.page = page
  fetchReviews()
}

async function toggleVisibility(rev: any) {
  try {
    const nextState = rev.isVisible === false
    await reviewService.moderate(rev._id, nextState)
    rev.isVisible = nextState
    toast.success(nextState ? 'Đã công khai đánh giá' : 'Đã ẩn đánh giá')
  } catch (err: any) {
    toast.error('Không thể thay đổi trạng thái hiển thị')
  }
}

function openReplyModal(rev: any) {
  selectedReview.value = rev
  replyText.value = rev.adminReply || ''
  showReplyModal.value = true
}

async function submitReply() {
  if (!selectedReview.value || !replyText.value.trim()) return
  submittingReply.value = true
  try {
    await reviewService.adminReply(selectedReview.value._id, replyText.value.trim())
    selectedReview.value.adminReply = replyText.value.trim()
    toast.success('Đã gửi phản hồi thành công')
    showReplyModal.value = false
  } catch (err: any) {
    toast.error('Lỗi khi gửi phản hồi')
  } finally {
    submittingReply.value = false
  }
}

function confirmDelete(rev: any) {
  selectedReview.value = rev
  showDeleteModal.value = true
}

async function submitDelete() {
  if (!selectedReview.value) return
  try {
    const prodId = selectedReview.value.product?._id || selectedReview.value.product || 'default'
    await reviewService.delete(prodId, selectedReview.value._id)
    toast.success('Đã xóa đánh giá thành công')
    showDeleteModal.value = false
    fetchReviews()
  } catch (err: any) {
    toast.error('Không thể xóa đánh giá')
  }
}

function previewImage(url: string) {
  window.open(url, '_blank')
}

onMounted(fetchReviews)
</script>
