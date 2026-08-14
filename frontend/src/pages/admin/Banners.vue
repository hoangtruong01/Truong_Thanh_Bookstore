<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">Quản lý Banner</h1>
        <p class="text-xs text-slate-500 font-medium mt-1">Thêm, sửa, xóa & tự động cắt/căn chỉnh ảnh banner hiển thị chuẩn trên trang chủ</p>
      </div>
      <button
        @click="openCreateModal"
        class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Thêm Banner mới
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
        class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
      >
        <!-- Preview Container -->
        <div>
          <div class="relative bg-slate-100 overflow-hidden aspect-[16/9] border-b border-slate-100">
            <img
              :src="banner.imageUrl"
              :alt="banner.title"
              class="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
            <!-- Status Badge -->
            <div class="absolute top-2 left-2">
              <span
                class="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-xs"
                :class="banner.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'"
              >
                {{ banner.isActive ? 'Đang hiện' : 'Đã ẩn' }}
              </span>
            </div>
            <!-- Position Badge -->
            <div class="absolute top-2 right-2">
              <span class="text-[10px] font-black px-2.5 py-1 rounded-lg bg-black/60 text-white backdrop-blur-xs uppercase tracking-wider">
                {{ getPositionLabel(banner.position) }}
              </span>
            </div>
          </div>

          <!-- Info -->
          <div class="p-4 space-y-2">
            <h3 class="text-sm font-extrabold text-slate-800 truncate">{{ banner.title }}</h3>
            <p v-if="banner.linkUrl" class="text-[10px] text-slate-400 font-medium truncate">Link: {{ banner.linkUrl }}</p>
            <div class="text-[10px] text-slate-400 font-semibold flex items-center gap-2">
              <span>Thứ tự: {{ banner.sortOrder }}</span>
              <span>•</span>
              <span>Tỷ lệ: {{ getPositionInfo(banner.position).ratioText }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-4 pt-0 border-t border-slate-50 flex items-center justify-between mt-auto">
          <button
            @click="toggleActive(banner)"
            class="text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
            :class="banner.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
          >
            <span>{{ banner.isActive ? '👁️ Đang hiện' : '🙈 Đã ẩn' }}</span>
          </button>

          <div class="flex items-center gap-1.5">
            <!-- Edit -->
            <button
              @click="openEditModal(banner)"
              class="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all cursor-pointer"
              title="Sửa banner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
            </button>
            <!-- Delete -->
            <button
              @click="confirmDelete(banner)"
              class="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer"
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

    <!-- Modal Create/Edit Banner -->
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
          <!-- Position Selection First to dictate aspect ratio -->
          <div>
            <label class="block text-xs font-extrabold text-slate-700 mb-1.5">Vị trí hiển thị *</label>
            <select
              v-model="form.position"
              @change="onPositionChange"
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] transition-all bg-white cursor-pointer"
            >
              <option v-for="pos in positionOptions.slice(1)" :key="pos.value" :value="pos.value">
                {{ pos.label }}
              </option>
            </select>
          </div>

          <!-- Position Aspect Ratio Guideline Box -->
          <div class="bg-amber-50 border border-amber-200/70 rounded-xl p-3 flex items-start gap-2.5">
            <span class="text-lg">💡</span>
            <div class="text-xs text-amber-900 font-medium">
              <span class="font-bold">Quy chuẩn ảnh cho "{{ getPositionLabel(form.position) }}":</span>
              <p class="mt-0.5 text-amber-800">
                Tỷ lệ hiển thị: <span class="font-extrabold text-amber-950">{{ currentPosInfo.ratioText }}</span> — Kích thước đề xuất: <span class="font-extrabold text-amber-950">{{ currentPosInfo.recommendedDim }}</span>.
              </p>
            </div>
          </div>

          <!-- Image Upload / Preview / Crop Button -->
          <div>
            <label class="block text-xs font-extrabold text-slate-700 mb-2">Ảnh Banner *</label>

            <!-- Preview Card if Image Loaded -->
            <div v-if="form.imageUrl" class="space-y-2">
              <div
                class="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2"
              >
                <!-- Simulated Homepage Box Preview -->
                <div
                  class="w-full relative overflow-hidden rounded-lg border border-slate-300/60 shadow-xs"
                  :style="{ aspectRatio: currentPosInfo.aspectRatio }"
                >
                  <img :src="form.imageUrl" class="w-full h-full object-cover object-center" />
                </div>

                <div class="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  <button
                    @click="openCropperWithCurrentImage"
                    type="button"
                    class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition-all flex items-center gap-1 cursor-pointer"
                  >
                    ✂️ Cắt / Căn chỉnh lại
                  </button>
                  <button
                    @click="form.imageUrl = ''; rawImageSrc = ''"
                    type="button"
                    class="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg shadow-md transition-all cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <p class="text-[11px] text-slate-400 font-semibold text-center">
                ✅ Ảnh đã được căn khớp tỷ lệ chuẩn {{ currentPosInfo.ratioText }} cho trang chủ
              </p>
            </div>

            <!-- Upload Zone -->
            <label
              v-else
              class="flex flex-col items-center justify-center w-full aspect-[3/1] border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[#dc2626] hover:bg-red-50/30 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-slate-300 mb-2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
              <span class="text-xs font-bold text-slate-600">Click để chọn ảnh từ máy tính</span>
              <span class="text-[10px] text-slate-400 mt-1">Hệ thống sẽ tự động mở công cụ Cắt & Căn chỉnh ảnh vừa vặn</span>
              <input type="file" accept="image/*" class="hidden" @change="handleImageFileSelected" />
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
          <div class="flex items-center justify-between pt-2">
            <span class="text-xs font-extrabold text-slate-700">Hiển thị banner ngay</span>
            <button
              @click="form.isActive = !form.isActive"
              type="button"
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
            type="button"
            class="px-5 py-2.5 text-xs font-extrabold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            @click="saveBanner"
            type="button"
            :disabled="saving || !form.title || !form.imageUrl"
            class="px-5 py-2.5 text-xs font-extrabold text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="saving" class="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ editingBanner ? 'Cập nhật Banner' : 'Tạo Banner' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Interactive Image Cropper Modal -->
    <div v-if="showCropperModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="closeCropperModal" class="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 class="text-base font-black flex items-center gap-2">
              <span>✂️</span> Cắt & Căn chỉnh Ảnh Banner
            </h2>
            <p class="text-[11px] text-slate-300 mt-0.5">
              Vị trí: <span class="font-bold text-amber-400">{{ getPositionLabel(form.position) }}</span> — Tỷ lệ chuẩn: <span class="font-bold text-emerald-400">{{ currentPosInfo.ratioText }}</span>
            </p>
          </div>
          <button @click="closeCropperModal" class="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Cropper Workspace -->
        <div class="p-6 space-y-5 overflow-y-auto flex-1 bg-slate-50">
          <!-- Canvas Crop Area -->
          <div class="flex flex-col items-center justify-center space-y-3">
            <div class="text-xs font-bold text-slate-600 flex items-center gap-2">
              <span>Khung xem trước trực tiếp (Live Canvas):</span>
              <button
                @click="autoFitCrop"
                type="button"
                class="text-[11px] font-extrabold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg hover:bg-amber-200 transition-all cursor-pointer"
              >
                🪄 Tự động cắt khít tâm ảnh (Auto Cover)
              </button>
            </div>

            <!-- Canvas Container -->
            <div class="relative border-2 border-slate-800/20 rounded-xl overflow-hidden shadow-lg bg-black/5 p-2 flex items-center justify-center">
              <canvas
                ref="cropperCanvas"
                class="max-w-full rounded-lg shadow-inner bg-slate-900 cursor-move"
                @mousedown="startDrag"
                @mousemove="doDrag"
                @mouseup="stopDrag"
                @mouseleave="stopDrag"
              ></canvas>
            </div>
            <p class="text-[10px] text-slate-400 italic">💡 Mẹo: Bạn có thể dùng chuột kéo thả trực tiếp trên khung ảnh để căn chỉnh vị trí đẹp nhất.</p>
          </div>

          <!-- Controls Grid -->
          <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs">
            <!-- Zoom Slider -->
            <div>
              <div class="flex items-center justify-between text-xs font-extrabold text-slate-700 mb-1">
                <span>🔍 Phóng to / Thu nhỏ: {{ Math.round(cropZoom * 100) }}%</span>
                <button @click="cropZoom = 1; updateCanvas()" class="text-[10px] text-blue-600 hover:underline cursor-pointer">Đặt lại 100%</button>
              </div>
              <input
                v-model.number="cropZoom"
                @input="updateCanvas"
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                class="w-full accent-[#dc2626] cursor-pointer"
              />
            </div>

            <!-- Position X & Y Sliders -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="block text-xs font-bold text-slate-600 mb-1">↔️ Dịch chuyển Ngang (X)</span>
                <input
                  v-model.number="cropOffsetX"
                  @input="updateCanvas"
                  type="range"
                  min="-300"
                  max="300"
                  step="1"
                  class="w-full accent-slate-700 cursor-pointer"
                />
              </div>
              <div>
                <span class="block text-xs font-bold text-slate-600 mb-1">↕️ Dịch chuyển Dọc (Y)</span>
                <input
                  v-model.number="cropOffsetY"
                  @input="updateCanvas"
                  type="range"
                  min="-300"
                  max="300"
                  step="1"
                  class="w-full accent-slate-700 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <label class="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1">
            <span>📁 Chọn ảnh khác</span>
            <input type="file" accept="image/*" class="hidden" @change="handleImageFileSelected" />
          </label>

          <div class="flex items-center gap-3">
            <button
              @click="closeCropperModal"
              type="button"
              class="px-4 py-2 text-xs font-extrabold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              @click="applyCroppedImage"
              type="button"
              class="px-5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>✂️</span> Xác nhận Cắt & Áp dụng Banner
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
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
import { ref, computed, onMounted, nextTick } from 'vue'
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

// Cropper state
const showCropperModal = ref(false)
const rawImageSrc = ref('')
const cropperCanvas = ref<HTMLCanvasElement | null>(null)
const cropZoom = ref(1)
const cropOffsetX = ref(0)
const cropOffsetY = ref(0)
const isDragging = ref(false)
let dragStartX = 0
let dragStartY = 0
let dragInitialOffsetX = 0
let dragInitialOffsetY = 0
let loadedImgElement: HTMLImageElement | null = null

const positionOptions = [
  { value: 'all', label: 'Tất cả vị trí' },
  { value: 'main_slider', label: '🖼️ Slider chính (16:9)' },
  { value: 'sidebar_left', label: '◀️ Sidebar trái (3:4)' },
  { value: 'sidebar_right_top', label: '▶️ Sidebar phải trên (2:1)' },
  { value: 'sidebar_right_bottom', label: '▶️ Sidebar phải dưới (2:1)' },
  { value: 'bottom_row', label: '⬇️ Banner hàng dưới (2.5:1)' },
]

const positionSpecs: Record<string, { ratio: number; ratioText: string; recommendedDim: string; aspectRatio: string }> = {
  main_slider: { ratio: 16 / 9, ratioText: '16:9', recommendedDim: '1200 x 675px', aspectRatio: '16/9' },
  sidebar_left: { ratio: 3 / 4, ratioText: '3:4', recommendedDim: '600 x 800px', aspectRatio: '3/4' },
  sidebar_right_top: { ratio: 2 / 1, ratioText: '2:1', recommendedDim: '600 x 300px', aspectRatio: '2/1' },
  sidebar_right_bottom: { ratio: 2 / 1, ratioText: '2:1', recommendedDim: '600 x 300px', aspectRatio: '2/1' },
  bottom_row: { ratio: 2.5 / 1, ratioText: '2.5:1', recommendedDim: '600 x 240px', aspectRatio: '2.5/1' },
}

const defaultForm = () => ({
  title: '',
  imageUrl: '',
  linkUrl: '',
  position: 'main_slider',
  sortOrder: 0,
  isActive: true,
})

const form = ref(defaultForm())

const currentPosInfo = computed(() => {
  return positionSpecs[form.value.position] || positionSpecs.main_slider
})

const filteredBanners = computed(() => {
  if (filterPosition.value === 'all') return banners.value
  return banners.value.filter((b) => b.position === filterPosition.value)
})

function getPositionLabel(pos: string) {
  const found = positionOptions.find((o) => o.value === pos)
  return found ? found.label.replace(/[^\w\sÀ-ỹ()]/g, '').trim() : pos
}

function getPositionInfo(pos: string) {
  return positionSpecs[pos] || positionSpecs.main_slider
}

function onPositionChange() {
  if (rawImageSrc.value && form.value.imageUrl) {
    openCropperModalWithSrc(rawImageSrc.value || form.value.imageUrl)
  }
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
  rawImageSrc.value = ''
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
  rawImageSrc.value = banner.imageUrl
  showModal.value = true
}

function handleImageFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (file.size > 8 * 1024 * 1024) {
    toast.error('Kích thước file ảnh quá lớn (tối đa 8MB)')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    const src = e.target?.result as string
    rawImageSrc.value = src
    openCropperModalWithSrc(src)
  }
  reader.readAsDataURL(file)
}

function openCropperWithCurrentImage() {
  const src = rawImageSrc.value || form.value.imageUrl
  if (src) {
    openCropperModalWithSrc(src)
  }
}

function openCropperModalWithSrc(src: string) {
  showCropperModal.value = true
  cropZoom.value = 1
  cropOffsetX.value = 0
  cropOffsetY.value = 0

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    loadedImgElement = img
    nextTick(() => {
      autoFitCrop()
    })
  }
  img.src = src
}

function closeCropperModal() {
  showCropperModal.value = false
}

function autoFitCrop() {
  cropZoom.value = 1
  cropOffsetX.value = 0
  cropOffsetY.value = 0
  updateCanvas()
}

function updateCanvas() {
  if (!cropperCanvas.value || !loadedImgElement) return
  const canvas = cropperCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const targetRatio = currentPosInfo.value.ratio
  const canvasWidth = 560
  const canvasHeight = Math.round(canvasWidth / targetRatio)

  canvas.width = canvasWidth
  canvas.height = canvasHeight

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  const img = loadedImgElement
  const imgRatio = img.width / img.height

  let renderW = canvasWidth
  let renderH = canvasHeight

  if (imgRatio > targetRatio) {
    renderH = canvasHeight
    renderW = canvasHeight * imgRatio
  } else {
    renderW = canvasWidth
    renderH = canvasWidth / imgRatio
  }

  renderW *= cropZoom.value
  renderH *= cropZoom.value

  const drawX = (canvasWidth - renderW) / 2 + cropOffsetX.value
  const drawY = (canvasHeight - renderH) / 2 + cropOffsetY.value

  ctx.drawImage(img, drawX, drawY, renderW, renderH)
}

function startDrag(e: MouseEvent) {
  isDragging.value = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragInitialOffsetX = cropOffsetX.value
  dragInitialOffsetY = cropOffsetY.value
}

function doDrag(e: MouseEvent) {
  if (!isDragging.value) return
  const deltaX = e.clientX - dragStartX
  const deltaY = e.clientY - dragStartY
  cropOffsetX.value = dragInitialOffsetX + deltaX
  cropOffsetY.value = dragInitialOffsetY + deltaY
  updateCanvas()
}

function stopDrag() {
  isDragging.value = false
}

function applyCroppedImage() {
  if (!cropperCanvas.value) return
  const croppedDataUrl = cropperCanvas.value.toDataURL('image/webp', 0.92)
  form.value.imageUrl = croppedDataUrl
  showCropperModal.value = false
  toast.success(`Đã căn chỉnh ảnh khớp tỷ lệ ${currentPosInfo.value.ratioText}`)
}

async function saveBanner() {
  if (!form.value.title || !form.value.imageUrl) {
    toast.error('Vui lòng nhập tiêu đề và tải ảnh banner')
    return
  }
  saving.value = true
  try {
    if (editingBanner.value) {
      await bannerService.update(editingBanner.value._id, form.value)
      toast.success('Đã cập nhật banner thành công')
    } else {
      await bannerService.create(form.value)
      toast.success('Đã tạo banner mới thành công')
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
