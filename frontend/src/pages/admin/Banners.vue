<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">Quản lý Banner</h1>
        <p class="text-xs text-slate-500 font-medium mt-1">Thêm, sửa, xóa banner quảng cáo trên trang chủ</p>
      </div>
      <button
        @click="openCreateModal"
        class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Thêm Banner
      </button>
    </div>

    <!-- Position Filter -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="pos in positionOptions"
        :key="pos.value"
        @click="filterPosition = pos.value"
        class="text-xs font-bold px-4 py-2 rounded-lg border transition-all cursor-pointer"
        :class="filterPosition === pos.value
          ? 'bg-[#dc2626] text-white border-[#dc2626]'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'"
      >
        {{ pos.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="n in 6" :key="n" class="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
        <div class="bg-slate-200 rounded-xl aspect-video w-full"></div>
        <div class="h-4 bg-slate-200 rounded w-2/3 mt-3"></div>
        <div class="h-3 bg-slate-200 rounded w-1/3 mt-2"></div>
      </div>
    </div>

    <!-- Banner Grid -->
    <div v-else-if="filteredBanners.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="banner in filteredBanners"
        :key="banner._id"
        class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md transition-all group"
      >
        <!-- Preview -->
        <div class="relative aspect-video bg-slate-100 overflow-hidden">
          <img
            :src="banner.imageUrl"
            :alt="banner.title"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <!-- Status Badge -->
          <div class="absolute top-2 left-2">
            <span
              class="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider"
              :class="banner.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'"
            >
              {{ banner.isActive ? 'Đang hiện' : 'Đã ẩn' }}
            </span>
          </div>
          <!-- Position Badge -->
          <div class="absolute top-2 right-2">
            <span class="text-[10px] font-black px-2.5 py-1 rounded-lg bg-black/50 text-white backdrop-blur-xs uppercase tracking-wider">
              {{ getPositionLabel(banner.position) }}
            </span>
          </div>
        </div>

        <!-- Info -->
        <div class="p-4 space-y-3">
          <div>
            <h3 class="text-sm font-extrabold text-slate-800 truncate">{{ banner.title }}</h3>
            <p v-if="banner.linkUrl" class="text-[10px] text-slate-400 font-medium truncate mt-0.5">{{ banner.linkUrl }}</p>
          </div>

          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] text-slate-400 font-medium">Thứ tự: {{ banner.sortOrder }}</span>

            <div class="flex items-center gap-1.5">
              <!-- Toggle Active -->
              <button
                @click="toggleActive(banner)"
                class="p-1.5 rounded-lg transition-all cursor-pointer"
                :class="banner.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'"
                :title="banner.isActive ? 'Ẩn banner' : 'Hiện banner'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                  <path v-if="banner.isActive" stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path v-if="banner.isActive" stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path v-if="!banner.isActive" stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>
              <!-- Edit -->
              <button
                @click="openEditModal(banner)"
                class="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all cursor-pointer"
                title="Sửa banner"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
              </button>
              <!-- Delete -->
              <button
                @click="confirmDelete(banner)"
                class="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer"
                title="Xóa banner"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-20 bg-white rounded-2xl border border-slate-100">
      <div class="text-5xl mb-4">🖼️</div>
      <h3 class="text-lg font-extrabold text-slate-800">Chưa có banner nào</h3>
      <p class="text-xs text-slate-500 mt-1 font-medium">Bắt đầu thêm banner quảng cáo cho trang chủ</p>
      <button
        @click="openCreateModal"
        class="mt-4 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition-all cursor-pointer"
      >
        + Thêm Banner đầu tiên
      </button>
    </div>

    <!-- Modal Create/Edit -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="showModal = false" class="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 rounded-t-2xl z-10 flex items-center justify-between">
          <h2 class="text-lg font-black text-slate-900">{{ editingBanner ? 'Sửa Banner' : 'Thêm Banner mới' }}</h2>
          <button @click="showModal = false" class="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-5">
          <!-- Image Upload / Preview -->
          <div>
            <label class="block text-xs font-extrabold text-slate-700 mb-2">Ảnh Banner *</label>
            <div
              v-if="form.imageUrl"
              class="relative rounded-xl overflow-hidden border border-slate-200 mb-3"
            >
              <img :src="form.imageUrl" class="w-full aspect-video object-cover" />
              <button
                @click="form.imageUrl = ''"
                class="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <label
              class="flex flex-col items-center justify-center w-full aspect-[3/1] border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[#dc2626] hover:bg-red-50/30 transition-all"
              :class="{ 'hidden': form.imageUrl }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-slate-300 mb-2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
              <span class="text-xs font-bold text-slate-400">Click để tải ảnh lên</span>
              <span class="text-[10px] text-slate-300 mt-0.5">PNG, JPG, WEBP (max 5MB)</span>
              <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
            </label>
          </div>

          <!-- Title -->
          <div>
            <label class="block text-xs font-extrabold text-slate-700 mb-1.5">Tiêu đề *</label>
            <input
              v-model="form.title"
              type="text"
              placeholder="VD: Banner tựu trường 2026"
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] transition-all"
            />
          </div>

          <!-- Link URL -->
          <div>
            <label class="block text-xs font-extrabold text-slate-700 mb-1.5">Link khi click (tùy chọn)</label>
            <input
              v-model="form.linkUrl"
              type="text"
              placeholder="VD: /products?discounted=true"
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] transition-all"
            />
          </div>

          <!-- Position -->
          <div>
            <label class="block text-xs font-extrabold text-slate-700 mb-1.5">Vị trí hiển thị *</label>
            <select
              v-model="form.position"
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] transition-all bg-white cursor-pointer"
            >
              <option v-for="pos in positionOptions.slice(1)" :key="pos.value" :value="pos.value">
                {{ pos.label }}
              </option>
            </select>
          </div>

          <!-- Sort Order -->
          <div>
            <label class="block text-xs font-extrabold text-slate-700 mb-1.5">Thứ tự hiển thị</label>
            <input
              v-model.number="form.sortOrder"
              type="number"
              min="0"
              placeholder="0"
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] transition-all"
            />
          </div>

          <!-- Active Toggle -->
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-slate-700">Hiển thị banner</span>
            <button
              @click="form.isActive = !form.isActive"
              class="relative w-11 h-6 rounded-full transition-colors cursor-pointer"
              :class="form.isActive ? 'bg-emerald-500' : 'bg-slate-300'"
            >
              <div
                class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-xs transition-transform"
                :class="form.isActive ? 'translate-x-5.5' : 'translate-x-0.5'"
              ></div>
            </button>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 rounded-b-2xl flex items-center justify-end gap-3">
          <button
            @click="showModal = false"
            class="px-5 py-2.5 text-xs font-extrabold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            @click="saveBanner"
            :disabled="saving || !form.title || !form.imageUrl"
            class="px-5 py-2.5 text-xs font-extrabold text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="saving" class="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ editingBanner ? 'Cập nhật' : 'Tạo Banner' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="showDeleteConfirm = false" class="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div class="text-4xl mb-3">🗑️</div>
        <h3 class="text-lg font-black text-slate-900">Xóa banner?</h3>
        <p class="text-xs text-slate-500 mt-1 font-medium">Hành động này không thể hoàn tác</p>
        <div class="flex gap-3 mt-6">
          <button
            @click="showDeleteConfirm = false"
            class="flex-1 px-4 py-2.5 text-xs font-extrabold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            @click="deleteBanner"
            class="flex-1 px-4 py-2.5 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all cursor-pointer"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { bannerService } from '@/services/banner.service'

const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const banners = ref<any[]>([])
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const editingBanner = ref<any>(null)
const deletingBanner = ref<any>(null)
const filterPosition = ref('all')

const positionOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'main_slider', label: '🖼️ Slider chính' },
  { value: 'sidebar_left', label: '◀️ Sidebar trái' },
  { value: 'sidebar_right_top', label: '▶️ Phải trên' },
  { value: 'sidebar_right_bottom', label: '▶️ Phải dưới' },
  { value: 'bottom_row', label: '⬇️ Hàng dưới' },
]

const defaultForm = () => ({
  title: '',
  imageUrl: '',
  linkUrl: '',
  position: 'main_slider',
  sortOrder: 0,
  isActive: true,
})

const form = ref(defaultForm())

const filteredBanners = computed(() => {
  if (filterPosition.value === 'all') return banners.value
  return banners.value.filter(b => b.position === filterPosition.value)
})

function getPositionLabel(pos: string) {
  const found = positionOptions.find(o => o.value === pos)
  return found ? found.label.replace(/[^\w\sÀ-ỹ]/g, '').trim() : pos
}

async function fetchBanners() {
  loading.value = true
  try {
    const res = await bannerService.getAll()
    banners.value = res.data || res || []
  } catch (err) {
    console.error('Error fetching banners:', err)
    toast.error('Lỗi tải danh sách banner')
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingBanner.value = null
  form.value = defaultForm()
  showModal.value = true
}

function openEditModal(banner: any) {
  editingBanner.value = banner
  form.value = {
    title: banner.title,
    imageUrl: banner.imageUrl,
    linkUrl: banner.linkUrl || '',
    position: banner.position,
    sortOrder: banner.sortOrder || 0,
    isActive: banner.isActive,
  }
  showModal.value = true
}

function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Ảnh quá lớn (tối đa 5MB)')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    form.value.imageUrl = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

async function saveBanner() {
  if (!form.value.title || !form.value.imageUrl) {
    toast.error('Vui lòng điền đầy đủ thông tin')
    return
  }
  saving.value = true
  try {
    if (editingBanner.value) {
      await bannerService.update(editingBanner.value._id, form.value)
      toast.success('Đã cập nhật banner')
    } else {
      await bannerService.create(form.value)
      toast.success('Đã tạo banner mới')
    }
    showModal.value = false
    await fetchBanners()
  } catch (err: any) {
    toast.error(err?.message || 'Lỗi lưu banner')
  } finally {
    saving.value = false
  }
}

async function toggleActive(banner: any) {
  try {
    await bannerService.update(banner._id, { isActive: !banner.isActive })
    banner.isActive = !banner.isActive
    toast.success(banner.isActive ? 'Đã hiện banner' : 'Đã ẩn banner')
  } catch (err) {
    toast.error('Lỗi cập nhật trạng thái')
  }
}

function confirmDelete(banner: any) {
  deletingBanner.value = banner
  showDeleteConfirm.value = true
}

async function deleteBanner() {
  if (!deletingBanner.value) return
  try {
    await bannerService.delete(deletingBanner.value._id)
    toast.success('Đã xóa banner')
    showDeleteConfirm.value = false
    await fetchBanners()
  } catch (err) {
    toast.error('Lỗi xóa banner')
  }
}

onMounted(() => {
  fetchBanners()
})
</script>
