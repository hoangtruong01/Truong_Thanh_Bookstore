<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
      <div>
        <h1 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          Kiểm duyệt Đánh giá Sản phẩm
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Quản lý, phản hồi và kiểm duyệt các đánh giá từ khách hàng đã mua sách & văn phòng phẩm
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="fetchReviews"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <span>🔄</span>
          <span>Làm mới</span>
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3 shadow-xs">
      <!-- Search Input -->
      <div class="relative flex-1 min-w-[200px]">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
        <input
          v-model="filters.search"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="Tìm theo tên khách hoặc nội dung đánh giá..."
          class="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-hidden focus:border-[#dc2626]"
        />
      </div>

      <!-- Rating Filter -->
      <select
        v-model="filters.rating"
        @change="handleFilterChange"
        class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden"
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
        class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden"
      >
        <option :value="undefined">Tất cả trạng thái</option>
        <option :value="true">Đang hiển thị</option>
        <option :value="false">Đã ẩn (vi phạm)</option>
      </select>
    </div>

    <!-- Loading Skeleton -->
    <SkeletonLoader v-if="loading" type="table" :count="5" />

    <!-- Empty State -->
    <EmptyState
      v-else-if="reviews.length === 0"
      icon="⭐"
      title="Không tìm thấy đánh giá nào"
      description="Chưa có đánh giá nào phù hợp với bộ lọc hiện tại."
    />

    <!-- Reviews Table -->
    <div v-else class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
              <th class="py-4 px-6">Sản phẩm</th>
              <th class="py-4 px-6">Khách hàng</th>
              <th class="py-4 px-6">Đánh giá</th>
              <th class="py-4 px-6">Nội dung</th>
              <th class="py-4 px-6">Trạng thái</th>
              <th class="py-4 px-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <tr
              v-for="rev in reviews"
              :key="rev._id"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <!-- Product -->
              <td class="py-4 px-6 max-w-[220px]">
                <div class="flex items-center gap-3">
                  <img
                    :src="rev.product?.images?.[0] || 'https://placehold.co/80x80/f1f5f9/94a3b8?text=Book'"
                    class="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    :alt="rev.product?.name || 'Sản phẩm'"
                  />
                  <div class="min-w-0">
                    <p class="font-bold text-slate-900 dark:text-white truncate">
                      {{ rev.product?.name || 'Sản phẩm' }}
                    </p>
                    <p class="text-[10px] text-slate-400 font-mono">
                      {{ rev.product?.sku || rev.product?._id }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- Customer -->
              <td class="py-4 px-6 whitespace-nowrap">
                <div class="font-bold text-slate-800 dark:text-slate-200">
                  {{ rev.name || rev.user?.fullName || 'Khách hàng' }}
                </div>
                <div class="text-[10px] text-slate-400">
                  {{ rev.user?.email || 'N/A' }}
                </div>
                <span
                  v-if="rev.isVerifiedPurchase"
                  class="inline-block mt-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded"
                >
                  ✓ Đã mua hàng
                </span>
              </td>

              <!-- Rating -->
              <td class="py-4 px-6 whitespace-nowrap">
                <div class="flex items-center text-amber-400 text-sm">
                  <span v-for="star in 5" :key="star">
                    {{ star <= rev.rating ? '★' : '☆' }}
                  </span>
                </div>
                <span class="text-[10px] text-slate-400 mt-0.5 block">
                  {{ formatDate(rev.createdAt) }}
                </span>
              </td>

              <!-- Content & Reply -->
              <td class="py-4 px-6 max-w-xs">
                <p class="text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
                  {{ rev.content }}
                </p>

                <!-- Review Images -->
                <div v-if="rev.images && rev.images.length > 0" class="flex gap-1.5 mt-2">
                  <img
                    v-for="(img, idx) in rev.images"
                    :key="idx"
                    :src="img"
                    class="w-8 h-8 rounded object-cover border border-slate-200 dark:border-slate-700"
                    alt="review-img"
                  />
                </div>

                <!-- Admin Reply Display -->
                <div
                  v-if="rev.adminReply"
                  class="mt-2 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300"
                >
                  <span class="font-bold text-[#dc2626]">Phản hồi Admin:</span> {{ rev.adminReply }}
                </div>
              </td>

              <!-- Status -->
              <td class="py-4 px-6 whitespace-nowrap">
                <button
                  @click="toggleVisibility(rev)"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-colors"
                  :class="[
                    rev.isVisible !== false
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100'
                      : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 hover:bg-red-100'
                  ]"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="rev.isVisible !== false ? 'bg-emerald-500' : 'bg-red-500'"></span>
                  <span>{{ rev.isVisible !== false ? 'Hiển thị' : 'Đã ẩn' }}</span>
                </button>
              </td>

              <!-- Actions -->
              <td class="py-4 px-6 whitespace-nowrap text-right space-x-2">
                <button
                  @click="openReplyModal(rev)"
                  class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
                  title="Trả lời đánh giá"
                >
                  💬 Trả lời
                </button>
                <button
                  @click="openDeleteModal(rev)"
                  class="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg font-bold transition-colors cursor-pointer"
                  title="Xóa đánh giá"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span class="text-xs text-slate-500">
          Trang {{ currentPage }} / {{ totalPages }} (Tổng {{ total }} đánh giá)
        </span>
        <div class="flex gap-2">
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
          >
            ← Trước
          </button>
          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
          >
            Sau →
          </button>
        </div>
      </div>
    </div>

    <!-- Reply Modal -->
    <div v-if="showReplyModal" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" @click="showReplyModal = false"></div>
      <div class="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl z-10 space-y-4">
        <h3 class="text-base font-black text-slate-900 dark:text-white">
          Phản hồi Đánh giá của {{ selectedReview?.name }}
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl italic">
          "{{ selectedReview?.content }}"
        </p>
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300">Nội dung phản hồi từ Cửa hàng:</label>
          <textarea
            v-model="replyText"
            rows="4"
            placeholder="Nhập nội dung phản hồi chân thành đến khách hàng..."
            class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-hidden focus:border-[#dc2626]"
          ></textarea>
        </div>
        <div class="flex gap-3 justify-end pt-2">
          <button
            type="button"
            @click="showReplyModal = false"
            class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            @click="submitReply"
            :disabled="!replyText.trim()"
            class="px-5 py-2 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer"
          >
            Gửi phản hồi
          </button>
        </div>
      </div>
    </div>

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
import { ref, reactive, onMounted } from 'vue';
import { reviewService, type ReviewQuery } from '@/services/review.service';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import EmptyState from '@/components/EmptyState.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { useToast } from 'vue-toastification';

const toast = useToast();
const reviews = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const totalPages = ref(1);
const loading = ref(true);

const filters = reactive<ReviewQuery>({
  page: 1,
  limit: 10,
  search: '',
  rating: undefined,
  isVisible: undefined,
});

const showReplyModal = ref(false);
const showDeleteModal = ref(false);
const selectedReview = ref<any>(null);
const replyText = ref('');

async function fetchReviews() {
  loading.value = true;
  try {
    const res = await reviewService.getAllAdmin({
      page: filters.page,
      limit: filters.limit,
      search: filters.search || undefined,
      rating: filters.rating,
      isVisible: filters.isVisible,
    });
    const data = res.data?.data || res.data || {};
    reviews.value = data.items || [];
    total.value = data.total || 0;
    currentPage.value = data.page || 1;
    totalPages.value = data.totalPages || 1;
  } catch (err: any) {
    toast.error('Không thể tải danh sách đánh giá');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  fetchReviews();
}

function handleFilterChange() {
  filters.page = 1;
  fetchReviews();
}

function changePage(page: number) {
  filters.page = page;
  fetchReviews();
}

async function toggleVisibility(rev: any) {
  try {
    const nextState = rev.isVisible === false;
    await reviewService.moderate(rev._id, nextState);
    rev.isVisible = nextState;
    toast.success(nextState ? 'Đã hiển thị đánh giá' : 'Đã ẩn đánh giá');
  } catch (err: any) {
    toast.error('Lỗi cập nhật trạng thái hiển thị');
  }
}

function openReplyModal(rev: any) {
  selectedReview.value = rev;
  replyText.value = rev.adminReply || '';
  showReplyModal.value = true;
}

async function submitReply() {
  if (!selectedReview.value) return;
  try {
    await reviewService.adminReply(selectedReview.value._id, replyText.value.trim());
    selectedReview.value.adminReply = replyText.value.trim();
    toast.success('Đã gửi phản hồi đánh giá thành công!');
    showReplyModal.value = false;
  } catch (err: any) {
    toast.error('Không thể gửi phản hồi đánh giá');
  }
}

function openDeleteModal(rev: any) {
  selectedReview.value = rev;
  showDeleteModal.value = true;
}

async function submitDelete() {
  if (!selectedReview.value) return;
  try {
    const productId = selectedReview.value.product?._id || selectedReview.value.product;
    await reviewService.delete(productId, selectedReview.value._id);
    toast.success('Đã xóa đánh giá thành công');
    showDeleteModal.value = false;
    fetchReviews();
  } catch (err: any) {
    toast.error('Không thể xóa đánh giá');
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

onMounted(() => {
  fetchReviews();
});
</script>
