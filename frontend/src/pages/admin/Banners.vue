<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">Quản lý Banner & Popup</h1>
        <p class="text-xs text-slate-500 font-medium mt-1">
          Quản lý banner trang chủ và quảng cáo popup khi mở website cho Trường Thành Bookstore
        </p>
      </div>
      <button
        class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
        @click="openCreateModal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Thêm Banner / Popup mới
      </button>
    </div>

    <!-- Position Filter -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="pos in positionOptions"
        :key="pos.value"
        class="text-xs font-bold px-4 py-2 rounded-lg border transition-all cursor-pointer"
        :class="filterPosition === pos.value
          ? 'bg-[#dc2626] text-white border-[#dc2626]'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'"
        @click="filterPosition = pos.value"
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
          <div
            class="relative overflow-hidden border-b border-slate-100"
            :class="banner.position === 'entry_popup' ? 'aspect-[4/3] bg-slate-950/90 flex items-center justify-center p-3' : 'aspect-[16/9] bg-slate-100'"
          >
            <img
              :src="banner.imageUrl"
              :alt="banner.title"
              class="transition-transform duration-300 group-hover:scale-105"
              :class="banner.position === 'entry_popup' ? 'max-h-full max-w-full object-contain rounded-lg shadow-md' : 'w-full h-full object-cover object-center'"
            />
            <!-- Status Badge -->
            <div class="absolute top-2 left-2 flex items-center gap-1.5">
              <span
                class="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-xs flex items-center gap-1"
                :class="getBannerStatus(banner).colorClass"
              >
                <span>{{ getBannerStatus(banner).icon }}</span>
                <span>{{ getBannerStatus(banner).label }}</span>
              </span>
            </div>
            <!-- Position Badge -->
            <div class="absolute top-2 right-2">
              <span
                class="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-xs"
                :class="banner.position === 'entry_popup' ? 'bg-[#dc2626] text-white shadow-red-900/30' : 'bg-black/60 text-white backdrop-blur-xs'"
              >
                {{ banner.position === 'entry_popup' ? '🚀 POPUP' : getPositionLabel(banner.position) }}
              </span>
            </div>
          </div>

          <!-- Info -->
          <div class="p-4 space-y-2">
            <div class="flex items-start justify-between gap-2">
              <h3 class="text-sm font-extrabold text-slate-800 truncate flex-1">{{ banner.title }}</h3>
              <span v-if="banner.position === 'entry_popup'" class="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 flex-shrink-0">
                CTA: "{{ banner.ctaLabel || 'Mở' }}"
              </span>
            </div>

            <p v-if="banner.linkUrl" class="text-[10px] text-slate-400 font-medium truncate">Link: {{ banner.linkUrl }}</p>

            <div class="text-[10px] text-slate-400 font-semibold flex flex-wrap items-center gap-2">
              <span v-if="banner.position === 'entry_popup'">Tần suất: {{ getFrequencyLabel(banner.frequency) }}</span>
              <span v-else>Tỷ lệ: {{ getPositionInfo(banner.position).ratioText }}</span>
              <span>•</span>
              <span>Thứ tự: {{ banner.sortOrder }}</span>
            </div>

            <div v-if="banner.position === 'entry_popup' && (banner.startAt || banner.endAt)" class="text-[10px] text-slate-500 font-medium bg-slate-50 p-2 rounded-lg space-y-0.5">
              <div v-if="banner.startAt">📅 Bắt đầu: {{ formatDisplayDate(banner.startAt) }}</div>
              <div v-if="banner.endAt">⌛ Kết thúc: {{ formatDisplayDate(banner.endAt) }}</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-4 pt-0 border-t border-slate-50 flex items-center justify-between mt-auto">
          <button
            class="text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
            :class="banner.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
            @click="toggleActive(banner)"
          >
            <span>{{ banner.isActive ? '👁️ Đang hiện' : '🙈 Đã ẩn' }}</span>
          </button>

          <div class="flex items-center gap-1.5">
            <!-- Preview Button (Especially useful for entry popups) -->
            <button
              v-if="banner.position === 'entry_popup'"
              class="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all cursor-pointer"
              title="Xem thử Popup như trên storefront"
              @click="openPreviewModal(banner)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button>

            <!-- Edit -->
            <button
              class="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all cursor-pointer"
              title="Sửa banner"
              @click="openEditModal(banner)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
            </button>
            <!-- Delete -->
            <button
              class="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer"
              title="Xóa banner"
              @click="confirmDelete(banner)"
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
      <p class="text-xs text-slate-500 mt-1 font-medium">Bắt đầu thêm banner hoặc popup quảng cáo cho website</p>
      <button
        class="mt-4 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition-all cursor-pointer"
        @click="openCreateModal"
      >
        + Thêm Banner / Popup đầu tiên
      </button>
    </div>

    <!-- Modal Create/Edit Banner -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" @click="showModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 rounded-t-2xl z-10 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-black text-slate-900">
              {{ form.position === 'entry_popup' ? (editingBanner ? 'Sửa Popup Quảng Cáo' : 'Tạo Popup Quảng Cáo Mới') : (editingBanner ? 'Sửa Banner' : 'Thêm Banner mới') }}
            </h2>
            <p v-if="form.position === 'entry_popup'" class="text-[11px] text-slate-400 font-medium">
              Quảng cáo tự động xuất hiện phủ phía trên website khi khách hàng truy cập
            </p>
          </div>
          <button class="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" @click="showModal = false">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-5">
          <!-- Position Selection -->
          <div>
            <label class="block text-xs font-extrabold text-slate-700 mb-1.5">Vị trí hiển thị *</label>
            <select
              v-model="form.position"
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] transition-all bg-white cursor-pointer"
              @change="onPositionChange"
            >
              <option v-for="pos in positionOptions.slice(1)" :key="pos.value" :value="pos.value">
                {{ pos.label }}
              </option>
            </select>
          </div>

          <!-- Position Guideline Box -->
          <div
            class="rounded-xl p-3 flex items-start gap-2.5 border"
            :class="form.position === 'entry_popup' ? 'bg-red-50/70 border-red-200/80 text-red-950' : 'bg-amber-50 border-amber-200/70 text-amber-900'"
          >
            <span class="text-lg">{{ form.position === 'entry_popup' ? '🚀' : '💡' }}</span>
            <div class="text-xs font-medium">
              <span class="font-bold">Quy chuẩn cho "{{ getPositionLabel(form.position) }}":</span>
              <p v-if="form.position === 'entry_popup'" class="mt-0.5 text-red-900/90 leading-relaxed">
                Ảnh popup giữ nguyên tỷ lệ tự nhiên, không bắt buộc cắt cố định. Khuyến nghị ảnh dạng poster (kích thước ~800x1000px hoặc 800x800px).
              </p>
              <p v-else class="mt-0.5 text-amber-800">
                Tỷ lệ hiển thị: <span class="font-extrabold text-amber-950">{{ currentPosInfo.ratioText }}</span> — Kích thước đề xuất: <span class="font-extrabold text-amber-950">{{ currentPosInfo.recommendedDim }}</span>.
              </p>
            </div>
          </div>

          <!-- Image Upload & Live Preview -->
          <div>
            <label class="block text-xs font-extrabold text-slate-700 mb-2">
              {{ form.position === 'entry_popup' ? 'Ảnh Quảng Cáo Popup *' : 'Ảnh Banner *' }}
            </label>

            <!-- Preview Card if Image Loaded -->
            <div v-if="form.imageUrl" class="space-y-2">
              <!-- If Entry Popup: Show simulated storefront interstitial ad -->
              <div
                v-if="form.position === 'entry_popup'"
                class="relative rounded-2xl overflow-hidden bg-slate-950/95 p-5 border border-slate-800 shadow-2xl flex flex-col items-center"
              >
                <!-- Mini Storefront Close icon -->
                <div class="w-full flex justify-end pb-2">
                  <span class="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-black shadow-xs">✕</span>
                </div>
                <!-- Image -->
                <img
                  :src="form.imageUrl"
                  class="max-h-60 w-auto object-contain rounded-xl shadow-lg border border-white/10"
                />
                <!-- Simulated CTA Button -->
                <div class="mt-3">
                  <span class="bg-[#dc2626] text-white text-xs font-black px-6 py-2 rounded-xl shadow-md inline-flex items-center gap-1.5">
                    {{ form.ctaLabel || 'Mở' }}
                  </span>
                </div>
                <!-- Simulator Tag -->
                <div class="absolute top-2 left-2">
                  <span class="text-[9px] font-black px-2 py-0.5 rounded bg-black/70 text-slate-300 backdrop-blur-xs uppercase">
                    Mô phỏng Storefront
                  </span>
                </div>
                <!-- Edit / Remove Actions -->
                <div class="absolute bottom-2 right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    class="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md transition-all cursor-pointer"
                    @click="openCropperWithCurrentImage"
                  >
                    ✂️ Cắt lại
                  </button>
                  <button
                    type="button"
                    class="bg-red-500 hover:bg-red-600 text-white p-1 rounded-lg shadow-md transition-all cursor-pointer"
                    title="Xóa ảnh"
                    @click="form.imageUrl = ''; rawImageSrc = ''"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Regular Homepage Banner Simulated Box -->
              <div
                v-else
                class="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2"
              >
                <div
                  class="w-full relative overflow-hidden rounded-lg border border-slate-300/60 shadow-xs"
                  :style="{ aspectRatio: currentPosInfo.aspectRatio }"
                >
                  <img :src="form.imageUrl" class="w-full h-full object-cover object-center" />
                </div>

                <div class="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition-all flex items-center gap-1 cursor-pointer"
                    @click="openCropperWithCurrentImage"
                  >
                    ✂️ Cắt / Căn chỉnh lại
                  </button>
                  <button
                    type="button"
                    class="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg shadow-md transition-all cursor-pointer"
                    @click="form.imageUrl = ''; rawImageSrc = ''"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <p class="text-[11px] text-slate-400 font-semibold text-center">
                {{ form.position === 'entry_popup' ? '✅ Ảnh popup giữ tỷ lệ tự nhiên đẹp mắt' : `✅ Ảnh đã được căn khớp tỷ lệ chuẩn ${currentPosInfo.ratioText}` }}
              </p>
            </div>

            <!-- Upload Zone -->
            <div v-else>
              <ImageUploader
                v-model="form.imageUrl"
                :multiple="false"
                :max-files="1"
                :max-size-m-b="form.position === 'entry_popup' ? 8 : 4"
                :allow-url-input="true"
                label=""
                @upload-file="onBannerFileSelected"
              />
            </div>
          </div>

          <!-- Title -->
          <div>
            <label class="block text-xs font-extrabold text-slate-700 mb-1.5">
              {{ form.position === 'entry_popup' ? 'Tên quảng cáo *' : 'Tiêu đề banner *' }}
            </label>
            <input
              v-model="form.title"
              type="text"
              :placeholder="form.position === 'entry_popup' ? 'VD: Khuyến mãi Khai trương mùa tựu trường' : 'VD: Banner tựu trường 2026'"
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] transition-all"
            />
          </div>

          <!-- Link URL -->
          <div>
            <label class="block text-xs font-extrabold text-slate-700 mb-1.5">URL khi click (tùy chọn)</label>
            <input
              v-model="form.linkUrl"
              type="text"
              placeholder="VD: /products?discounted=true hoặc https://..."
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] transition-all"
            />
          </div>

          <!-- Entry Popup Specific Fields -->
          <template v-if="form.position === 'entry_popup'">
            <!-- CTA Label -->
            <div>
              <label class="block text-xs font-extrabold text-slate-700 mb-1.5">Nhãn nút hành động (CTA)</label>
              <input
                v-model="form.ctaLabel"
                type="text"
                placeholder="VD: Mở, Xem ngay, Nhận ưu đãi"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] transition-all"
              />
            </div>

            <!-- Frequency -->
            <div>
              <label class="block text-xs font-extrabold text-slate-700 mb-1.5">Tần suất hiển thị *</label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label
                  class="flex items-center gap-2 p-3 border rounded-xl cursor-pointer text-xs font-bold transition-all"
                  :class="form.frequency === 'EVERY_VISIT' ? 'border-[#dc2626] bg-red-50/50 text-red-700 shadow-xs' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
                >
                  <input v-model="form.frequency" type="radio" value="EVERY_VISIT" class="accent-[#dc2626]" />
                  <span>Mỗi lần truy cập</span>
                </label>
                <label
                  class="flex items-center gap-2 p-3 border rounded-xl cursor-pointer text-xs font-bold transition-all"
                  :class="form.frequency === 'ONCE_PER_SESSION' ? 'border-[#dc2626] bg-red-50/50 text-red-700 shadow-xs' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
                >
                  <input v-model="form.frequency" type="radio" value="ONCE_PER_SESSION" class="accent-[#dc2626]" />
                  <span>Một lần / phiên</span>
                </label>
                <label
                  class="flex items-center gap-2 p-3 border rounded-xl cursor-pointer text-xs font-bold transition-all"
                  :class="form.frequency === 'ONCE_PER_DAY' ? 'border-[#dc2626] bg-red-50/50 text-red-700 shadow-xs' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
                >
                  <input v-model="form.frequency" type="radio" value="ONCE_PER_DAY" class="accent-[#dc2626]" />
                  <span>Một lần / ngày</span>
                </label>
              </div>
            </div>

            <!-- Schedule: Start and End Datetime -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-extrabold text-slate-700 mb-1.5">Thời gian bắt đầu (tùy chọn)</label>
                <input
                  v-model="form.startAt"
                  type="datetime-local"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] transition-all bg-white"
                />
              </div>
              <div>
                <label class="block text-xs font-extrabold text-slate-700 mb-1.5">Thời gian kết thúc (tùy chọn)</label>
                <input
                  v-model="form.endAt"
                  type="datetime-local"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] transition-all bg-white"
                />
              </div>
            </div>

            <!-- Closeable Toggle -->
            <div class="flex items-center justify-between pt-1">
              <div>
                <span class="text-xs font-extrabold text-slate-700 block">Cho phép khách hàng đóng popup</span>
                <span class="text-[10px] text-slate-400 font-medium">Hiện nút Đóng (✕) và hỗ trợ phím ESC</span>
              </div>
              <button
                type="button"
                class="relative w-11 h-6 rounded-full transition-colors cursor-pointer"
                :class="form.closeable ? 'bg-emerald-500' : 'bg-slate-300'"
                @click="form.closeable = !form.closeable"
              >
                <div
                  class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-xs transition-transform"
                  :class="form.closeable ? 'translate-x-5.5' : 'translate-x-0.5'"
                ></div>
              </button>
            </div>
          </template>

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
            <div>
              <span class="text-xs font-extrabold text-slate-700 block">
                {{ form.position === 'entry_popup' ? 'Kích hoạt popup ngay' : 'Hiển thị banner ngay' }}
              </span>
              <span v-if="form.position === 'entry_popup'" class="text-[10px] text-slate-400 font-medium">
                Khách hàng vào website sẽ thấy popup này theo tần suất cấu hình
              </span>
            </div>
            <button
              type="button"
              class="relative w-11 h-6 rounded-full transition-colors cursor-pointer"
              :class="form.isActive ? 'bg-emerald-500' : 'bg-slate-300'"
              @click="form.isActive = !form.isActive"
            >
              <div
                class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-xs transition-transform"
                :class="form.isActive ? 'translate-x-5.5' : 'translate-x-0.5'"
              ></div>
            </button>
          </div>

          <!-- Notice for single active popup -->
          <div
            v-if="form.position === 'entry_popup'"
            class="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2"
          >
            <span class="text-base">💡</span>
            <p class="font-medium text-[11px] leading-relaxed">
              <span class="font-bold">Quy tắc tự động:</span> Chỉ có tối đa 1 Popup quảng cáo hoạt động cùng một thời điểm. Khi kích hoạt popup này, hệ thống sẽ tự động tắt các popup khác đang chạy.
            </p>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 rounded-b-2xl flex items-center justify-end gap-3">
          <button
            type="button"
            class="px-5 py-2.5 text-xs font-extrabold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
            @click="showModal = false"
          >
            Hủy
          </button>
          <button
            type="button"
            :disabled="saving || !form.title || !form.imageUrl"
            class="px-5 py-2.5 text-xs font-extrabold text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            @click="saveBanner"
          >
            <svg v-if="saving" class="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ editingBanner ? 'Cập nhật' : (form.position === 'entry_popup' ? 'Tạo Popup' : 'Tạo Banner') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Storefront Full Preview Modal for Admin -->
    <div
      v-if="previewingPopup"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none"
      @click.self="closePreviewModal"
    >
      <div class="relative w-full max-w-[92vw] sm:max-w-[700px] flex flex-col items-center">
        <!-- Close Preview -->
        <div class="w-full flex justify-between items-center pb-3">
          <span class="text-xs font-black text-white/90 bg-black/50 px-3 py-1 rounded-lg backdrop-blur-xs">
            👁️ Đang xem trước Popup ngoài Storefront
          </span>
          <button
            class="w-10 h-10 rounded-full bg-white/20 hover:bg-white text-white hover:text-slate-900 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all cursor-pointer"
            title="Đóng xem trước"
            @click="closePreviewModal"
          >
            ✕
          </button>
        </div>

        <!-- Ad Image -->
        <div class="relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-white/20 shadow-2xl flex flex-col items-center">
          <img
            :src="previewingPopup.imageUrl"
            :alt="previewingPopup.title"
            class="w-full h-auto max-h-[70vh] object-contain"
          />
        </div>

        <!-- CTA Button -->
        <div class="mt-4 flex items-center justify-center w-full">
          <button
            class="bg-[#dc2626] text-white font-black text-sm sm:text-base px-10 py-3.5 rounded-2xl shadow-xl hover:bg-[#b91c1c] transition-all flex items-center gap-2 cursor-pointer"
            @click="closePreviewModal"
          >
            <span>{{ previewingPopup.ctaLabel || 'MỞ / XEM NGAY' }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Interactive Image Cropper Modal -->
    <div v-if="showCropperModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" @click="closeCropperModal"></div>
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
          <button class="text-slate-400 hover:text-white transition-colors cursor-pointer" @click="closeCropperModal">
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
                type="button"
                class="text-[11px] font-extrabold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg hover:bg-amber-200 transition-all cursor-pointer"
                @click="autoFitCrop"
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
                <button class="text-[10px] text-blue-600 hover:underline cursor-pointer" @click="cropZoom = 1; updateCanvas()">Đặt lại 100%</button>
              </div>
              <input
                v-model.number="cropZoom"
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                class="w-full accent-[#dc2626] cursor-pointer"
                @input="updateCanvas"
              />
            </div>

            <!-- Position X & Y Sliders -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="block text-xs font-bold text-slate-600 mb-1">↔️ Dịch chuyển Ngang (X)</span>
                <input
                  v-model.number="cropOffsetX"
                  type="range"
                  min="-300"
                  max="300"
                  step="1"
                  class="w-full accent-slate-700 cursor-pointer"
                  @input="updateCanvas"
                />
              </div>
              <div>
                <span class="block text-xs font-bold text-slate-600 mb-1">↕️ Dịch chuyển Dọc (Y)</span>
                <input
                  v-model.number="cropOffsetY"
                  type="range"
                  min="-300"
                  max="300"
                  step="1"
                  class="w-full accent-slate-700 cursor-pointer"
                  @input="updateCanvas"
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
              type="button"
              class="px-4 py-2 text-xs font-extrabold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              @click="closeCropperModal"
            >
              Hủy
            </button>
            <button
              type="button"
              class="px-5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              @click="applyCroppedImage"
            >
              <span>✂️</span> Xác nhận Cắt & Áp dụng Banner
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" @click="showDeleteConfirm = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div class="text-4xl mb-3">🗑️</div>
        <h3 class="text-lg font-black text-slate-900">Xóa banner?</h3>
        <p class="text-xs text-slate-500 mt-1 font-medium">Hành động này không thể hoàn tác</p>
        <div class="flex gap-3 mt-6">
          <button
            class="flex-1 px-4 py-2.5 text-xs font-extrabold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
            @click="showDeleteConfirm = false"
          >
            Hủy
          </button>
          <button
            class="flex-1 px-4 py-2.5 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all cursor-pointer"
            @click="deleteBanner"
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
import ImageUploader from '@/components/ImageUploader.vue'

const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const banners = ref<any[]>([])
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const editingBanner = ref<any>(null)
const deletingBanner = ref<any>(null)
const previewingPopup = ref<any>(null)
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
  { value: 'entry_popup', label: '🚀 Popup khi mở website' },
]

const positionSpecs: Record<string, { ratio: number; ratioText: string; recommendedDim: string; aspectRatio: string }> = {
  main_slider: { ratio: 16 / 9, ratioText: '16:9', recommendedDim: '1200 x 675px', aspectRatio: '16/9' },
  sidebar_left: { ratio: 3 / 4, ratioText: '3:4', recommendedDim: '600 x 800px', aspectRatio: '3/4' },
  sidebar_right_top: { ratio: 2 / 1, ratioText: '2:1', recommendedDim: '600 x 300px', aspectRatio: '2/1' },
  sidebar_right_bottom: { ratio: 2 / 1, ratioText: '2:1', recommendedDim: '600 x 300px', aspectRatio: '2/1' },
  bottom_row: { ratio: 2.5 / 1, ratioText: '2.5:1', recommendedDim: '600 x 240px', aspectRatio: '2.5/1' },
  entry_popup: { ratio: 1, ratioText: 'Tỷ lệ tự do', recommendedDim: '800 x 1000px hoặc 800 x 800px', aspectRatio: 'auto' },
}

const defaultForm = () => ({
  title: '',
  imageUrl: '',
  linkUrl: '',
  position: 'main_slider',
  sortOrder: 0,
  isActive: true,
  frequency: 'EVERY_VISIT',
  startAt: '',
  endAt: '',
  ctaLabel: 'Mở',
  closeable: true,
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

function getFrequencyLabel(freq?: string) {
  switch (freq) {
    case 'ONCE_PER_SESSION':
      return '1 lần / phiên'
    case 'ONCE_PER_DAY':
      return '1 lần / ngày'
    case 'EVERY_VISIT':
    default:
      return 'Mỗi lần truy cập'
  }
}

function getBannerStatus(banner: any) {
  if (!banner.isActive) {
    return { label: 'Đã tắt', colorClass: 'bg-slate-500 text-white', icon: '○' }
  }
  const now = Date.now()
  if (banner.startAt && new Date(banner.startAt).getTime() > now) {
    return { label: 'Đã lên lịch', colorClass: 'bg-amber-500 text-white', icon: '⏰' }
  }
  if (banner.endAt && new Date(banner.endAt).getTime() < now) {
    return { label: 'Hết hạn', colorClass: 'bg-rose-500 text-white', icon: '⌛' }
  }
  return { label: 'Đang chạy', colorClass: 'bg-emerald-500 text-white', icon: '●' }
}

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatForDateTimeLocal(dateStr: string | Date | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function onPositionChange() {
  if (form.value.position === 'entry_popup') {
    return
  }
  if (rawImageSrc.value && form.value.imageUrl) {
    openCropperModalWithSrc(rawImageSrc.value || form.value.imageUrl)
  }
}

function openPreviewModal(banner: any) {
  previewingPopup.value = banner
}

function closePreviewModal() {
  previewingPopup.value = null
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
    frequency: banner.frequency || 'EVERY_VISIT',
    startAt: formatForDateTimeLocal(banner.startAt),
    endAt: formatForDateTimeLocal(banner.endAt),
    ctaLabel: banner.ctaLabel || 'Mở',
    closeable: banner.closeable !== false,
  }
  rawImageSrc.value = banner.imageUrl
  showModal.value = true
}

function onBannerFileSelected(file: File) {
  if (file.size > 8 * 1024 * 1024) {
    toast.error('Kích thước file ảnh quá lớn (tối đa 8MB)')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    const src = e.target?.result as string
    rawImageSrc.value = src
    if (form.value.position === 'entry_popup') {
      form.value.imageUrl = src
      toast.success('Đã chọn ảnh quảng cáo popup')
    } else {
      openCropperModalWithSrc(src)
    }
  }
  reader.readAsDataURL(file)
}

function handleImageFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  onBannerFileSelected(file)
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

  const targetRatio = currentPosInfo.value.ratio || 1
  const canvasWidth = 560
  const canvasHeight = Math.round(canvasWidth / targetRatio)

  canvas.width = canvasWidth
  canvas.height = canvasHeight

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  const img = loadedImgElement
  const imgRatio = img.width / img.height

  let renderW: number
  let renderH: number

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
    const payload: any = {
      title: form.value.title.trim(),
      imageUrl: form.value.imageUrl,
      linkUrl: form.value.linkUrl ? form.value.linkUrl.trim() : '',
      position: form.value.position,
      sortOrder: form.value.sortOrder || 0,
      isActive: form.value.isActive,
    }

    if (form.value.position === 'entry_popup') {
      payload.frequency = form.value.frequency || 'EVERY_VISIT'
      payload.ctaLabel = form.value.ctaLabel ? form.value.ctaLabel.trim() : 'Mở'
      payload.closeable = form.value.closeable !== false
      payload.startAt = form.value.startAt ? new Date(form.value.startAt).toISOString() : null
      payload.endAt = form.value.endAt ? new Date(form.value.endAt).toISOString() : null
    }

    if (editingBanner.value) {
      await bannerService.update(editingBanner.value._id, payload)
      toast.success('Đã cập nhật banner thành công')
    } else {
      await bannerService.create(payload)
      toast.success('Đã tạo banner mới thành công')
    }
    showModal.value = false
    await fetchBanners()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || err?.message || 'Lỗi lưu banner')
  } finally {
    saving.value = false
  }
}

async function toggleActive(banner: any) {
  try {
    const newActive = !banner.isActive
    await bannerService.update(banner._id, { isActive: newActive })
    banner.isActive = newActive
    if (banner.position === 'entry_popup' && newActive) {
      toast.success('Đã bật Popup! Các popup khác đã được tự động tắt.')
      await fetchBanners()
    } else {
      toast.success(banner.isActive ? 'Đã hiện banner' : 'Đã ẩn banner')
    }
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi cập nhật trạng thái')
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
