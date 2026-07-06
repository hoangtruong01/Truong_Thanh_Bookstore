<template>
  <div class="space-y-6 max-w-3xl mx-auto">
    <div class="flex items-center justify-between bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
      <div class="space-y-1">
        <h2 class="text-lg font-extrabold text-slate-900">{{ isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới' }}</h2>
        <p class="text-xs text-slate-500 font-medium">Nhập thông tin sản phẩm chi tiết bên dưới.</p>
      </div>
      <button @click="$router.push('/admin/products')" class="text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-all">
        Quay lại
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-xs">
      <!-- General Info -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div class="sm:col-span-2">
          <label class="text-xs font-bold text-slate-700">Tên sản phẩm *</label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="Ví dụ: Bút bi Thiên Long..."
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Mã SKU *</label>
          <input
            v-model="form.sku"
            type="text"
            required
            placeholder="Ví dụ: TL-027"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Thương hiệu</label>
          <input
            v-model="form.brand"
            type="text"
            placeholder="Ví dụ: Thiên Long"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Combo sản phẩm *</label>
          <div class="flex items-center gap-2 mt-1">
            <select
              v-model="form.category"
              required
              class="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Chọn combo</option>
              <option v-for="cat in categories" :key="cat._id" :value="cat._id">
                {{ cat.name }}
              </option>
            </select>
            <button
              type="button"
              @click="toggleAddComboForm"
              class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center flex-shrink-0 shadow-xs hover:shadow-md"
              title="Thêm combo mới"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </button>
            <button
              v-if="form.category"
              type="button"
              @click="deleteSelectedCombo"
              class="bg-rose-600 hover:bg-rose-700 text-white font-bold p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center flex-shrink-0 shadow-xs hover:shadow-md"
              title="Xóa combo đang chọn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            </button>
          </div>

          <!-- Quick Add Combo Form -->
          <div v-if="showAddComboForm" class="mt-3 p-4 bg-slate-55 border border-slate-200 rounded-2xl space-y-3.5 shadow-xs transition-all duration-300">
            <div class="flex justify-between items-center pb-2 border-b border-slate-200">
              <span class="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Tạo nhanh Combo mới</span>
              <button type="button" @click="showAddComboForm = false" class="text-slate-400 hover:text-slate-650 text-sm font-bold">&times;</button>
            </div>
            
            <div class="space-y-3">
              <div>
                <label class="text-[10px] font-bold text-slate-600 block">Tên Combo *</label>
                <input
                  v-model="quickCombo.name"
                  type="text"
                  placeholder="Ví dụ: Combo Học Tập Tiết Kiệm"
                  class="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold"
                />
              </div>

              <div>
                <label class="text-[10px] font-bold text-slate-600 block">Tên nhãn bộ lọc (VD: Chọn Lớp)</label>
                <input
                  v-model="quickCombo.optionsLabel"
                  type="text"
                  placeholder="Ví dụ: Chọn Lớp"
                  class="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold"
                />
              </div>

              <div>
                <label class="text-[10px] font-bold text-slate-600 block">Giá trị bộ lọc bổ sung</label>
                <div class="flex gap-2 mt-1">
                  <input
                    v-model="quickComboOptionInput"
                    type="text"
                    placeholder="Điền tên rồi nhấn +..."
                    @keyup.enter.prevent="addQuickComboOption"
                    class="flex-grow bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold"
                  />
                  <button
                    type="button"
                    @click="addQuickComboOption"
                    class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
                    title="Thêm giá trị bộ lọc"
                  >
                    +
                  </button>
                </div>

                <!-- Display tags/chips of quick combo options -->
                <div v-if="quickCombo.options && quickCombo.options.length > 0" class="flex flex-wrap gap-1.5 p-2 mt-2 bg-white border border-slate-150 rounded-xl max-h-32 overflow-y-auto">
                  <span
                    v-for="(opt, idx) in quickCombo.options"
                    :key="idx"
                    class="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold pl-2 pr-1 py-0.5 rounded-full shadow-2xs"
                  >
                    <span>{{ opt }}</span>
                    <button
                      type="button"
                      @click="removeQuickComboOption(idx)"
                      class="w-3.5 h-3.5 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 font-extrabold text-[9px] cursor-pointer"
                    >
                      &times;
                    </button>
                  </span>
                </div>
              </div>

              <div class="flex gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  @click="submitQuickCombo"
                  :disabled="quickComboSubmitting"
                  class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer disabled:bg-slate-300"
                >
                  {{ quickComboSubmitting ? 'Đang tạo...' : 'Xác nhận tạo' }}
                </button>
                <button
                  type="button"
                  @click="showAddComboForm = false"
                  class="bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Trạng thái hoạt động</label>
          <select
            v-model="form.status"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ACTIVE">Hoạt động (Active)</option>
            <option value="INACTIVE">Ngừng hoạt động (Inactive)</option>
          </select>
        </div>

        <!-- Dynamic Category Sub-options Selector -->
        <div v-if="activeCategoryOptions" class="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
          <div class="flex justify-between items-center border-b border-slate-150 pb-2">
            <label class="text-xs font-bold text-slate-700 block">
              Phân loại bổ sung cho sản phẩm (Theo {{ activeCategoryOptions.optionsLabel || 'Tùy Chọn' }}):
            </label>
            
            <!-- Quick Add Option value -->
            <div class="flex items-center gap-1">
              <input
                v-model="newQuickOptionVal"
                type="text"
                placeholder="Thêm phân loại..."
                class="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700 font-semibold w-36"
                @keyup.enter.prevent="addQuickOption"
              />
              <button
                type="button"
                @click="addQuickOption"
                class="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-2 py-1 text-xs font-black cursor-pointer transition-colors flex items-center justify-center"
                title="Thêm phân loại mới"
              >
                +
              </button>
            </div>
          </div>

          <div v-if="activeCategoryOptions.options && activeCategoryOptions.options.length" class="flex flex-wrap gap-2.5">
            <div
              v-for="(opt, idx) in activeCategoryOptions.options"
              :key="idx"
              class="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl pl-3 pr-1 py-1.5 shadow-2xs hover:border-blue-300 transition-all"
            >
              <label class="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  :value="opt"
                  v-model="form.subOptions"
                  class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 rounded cursor-pointer"
                />
                <span>{{ opt }}</span>
              </label>
              <!-- Delete Option from Category -->
              <button
                type="button"
                @click="removeQuickOption(opt)"
                class="w-4 h-4 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 font-extrabold text-[10px] cursor-pointer ml-1"
                title="Xóa khỏi danh mục"
              >
                &times;
              </button>
            </div>
          </div>
          <div v-else class="text-center py-4 bg-slate-50/50 text-slate-400 text-xs font-medium rounded-xl">
            Chưa có phân loại nào. Hãy nhập ở góc trên để thêm phân loại mới.
          </div>
        </div>
      </div>

      <!-- Pricing & Stock -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-slate-100 pt-6">
        <div>
          <label class="text-xs font-bold text-slate-700">Giá bán lẻ (VND) *</label>
          <input
            :value="formatNumberWithDots(form.price)"
            @input="handlePriceInput"
            type="text"
            required
            placeholder="0"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Số lượng kho ban đầu *</label>
          <input
            v-model.number="form.stock"
            type="number"
            required
            min="0"
            placeholder="0"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Đơn vị tính *</label>
          <input
            v-model="form.unit"
            type="text"
            required
            placeholder="Ví dụ: cái, quyển, vỉ..."
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>
      </div>

      <!-- Deal Sốc Giờ Vàng Settings -->
      <div class="border-t border-slate-100 pt-6 space-y-4">
        <div class="flex items-center justify-between bg-orange-50/50 border border-orange-100 rounded-2xl p-4">
          <div class="space-y-0.5 text-left">
            <span class="inline-flex items-center gap-1 bg-red-100 text-red-650 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              🔥 HOT DEAL
            </span>
            <h4 class="text-xs font-extrabold text-slate-800">Cấu hình Deal Sốc Giờ Vàng</h4>
            <p class="text-[10px] text-slate-400 font-medium">Đưa sản phẩm này vào danh mục khuyến mãi đặc biệt trên trang chủ.</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              v-model="isHotDeal" 
              @change="handleHotDealToggle"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        <div v-if="isHotDeal" class="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 border border-slate-200 rounded-2xl p-5 animate-fadeIn">
          <div>
            <label class="text-xs font-bold text-slate-700">Giá đã giảm (VND) *</label>
            <input
              :value="formatNumberWithDots(form.discountPrice)"
              @input="handleDiscountPriceInput"
              type="text"
              required
              placeholder="Nhập giá khuyến mãi..."
              class="w-full mt-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 font-semibold text-red-650"
            />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700 block">Tính nhanh giá giảm theo %</label>
            <div class="flex gap-2 mt-1">
              <button 
                v-for="percent in [10, 15, 20, 30, 50]" 
                :key="percent"
                type="button"
                @click="applyPercentageDiscount(percent)"
                class="flex-1 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 text-slate-750 hover:text-red-600 font-extrabold py-2 rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
              >
                -{{ percent }}%
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Description & Image URLs -->
      <div class="space-y-4 border-t border-slate-100 pt-6">
        <div class="space-y-3">
          <label class="text-xs font-bold text-slate-700 block mb-1">Hình ảnh sản phẩm *</label>
          
          <!-- Tab Switcher -->
          <div class="flex border-b border-slate-200 gap-4 mb-2">
            <button
              type="button"
              @click="imageTab = 'url'"
              :class="['pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer', imageTab === 'url' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600']"
            >
              Nhập Link ảnh (URL)
            </button>
            <button
              type="button"
              @click="imageTab = 'upload'"
              :class="['pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer', imageTab === 'upload' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600']"
            >
              Tải ảnh thủ công (File)
            </button>
          </div>

          <!-- Tab 1: URL input -->
          <div v-if="imageTab === 'url'" class="space-y-2">
            <div class="flex gap-2">
              <input
                v-model="tempUrl"
                type="text"
                placeholder="Nhập đường dẫn hình ảnh (https://...) rồi nhấn Thêm"
                @keydown.enter.prevent="addImageUrl"
                class="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
              <button
                type="button"
                @click="addImageUrl"
                class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              >
                Thêm
              </button>
            </div>
            <p class="text-[10px] text-slate-400">Có thể nhập nhiều URL bằng cách thêm từng link.</p>
          </div>

          <!-- Tab 2: Manual upload input -->
          <div v-if="imageTab === 'upload'" class="space-y-2">
            <div
              @click="triggerFileInput"
              @dragover.prevent
              @drop.prevent="handleFileDrop"
              class="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-6 transition-all flex flex-col items-center justify-center cursor-pointer text-center bg-slate-50/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-slate-400 mb-2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
              </svg>
              <span class="text-xs font-bold text-slate-700">Kéo thả ảnh hoặc click để chọn ảnh</span>
              <span class="text-[10px] text-slate-400 mt-1">Định dạng JPG, PNG, WEBP. Cho phép chọn nhiều ảnh.</span>
              <input
                type="file"
                ref="fileInput"
                multiple
                accept="image/*"
                class="hidden"
                @change="handleFileSelect"
              />
            </div>
          </div>

          <!-- Images Preview Grid -->
          <div v-if="imagesList.length > 0" class="space-y-2 pt-2">
            <span class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Danh sách ảnh đã chọn ({{ imagesList.length }})</span>
            <div class="grid grid-cols-4 sm:grid-cols-5 gap-3">
              <div
                v-for="(img, idx) in imagesList"
                :key="idx"
                class="relative aspect-square rounded-2xl overflow-hidden group border border-slate-200 bg-slate-50 shadow-xs flex items-center justify-center"
              >
                <img :src="img" class="w-full h-full object-contain" />
                <div class="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    @click="removeImage(idx)"
                    class="bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md cursor-pointer transition-all hover:scale-110"
                    title="Xóa ảnh"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Mô tả sản phẩm</label>
          <textarea
            v-model="form.description"
            rows="5"
            placeholder="Mô tả chi tiết tính năng, công dụng sản phẩm..."
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          ></textarea>
        </div>

        <!-- Featured Switch -->
        <div class="flex items-center gap-3">
          <input
            v-model="form.isFeatured"
            type="checkbox"
            id="isFeatured"
            class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
          />
          <label for="isFeatured" class="text-xs font-bold text-slate-700 cursor-pointer">Sản phẩm nổi bật (Featured)</label>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-4 border-t border-slate-100 pt-6">
        <button
          type="submit"
          :disabled="submitting"
          class="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center text-sm uppercase tracking-wider shadow-lg shadow-blue-500/20 disabled:bg-slate-300 disabled:shadow-none"
        >
          {{ submitting ? 'Đang lưu...' : 'Lưu sản phẩm' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import type { Category } from '@/types'

const formatNumberWithDots = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '';
  const clean = String(val).replace(/\D/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const handlePriceInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const rawValue = target.value;
  const cleanValue = rawValue.replace(/\D/g, '');
  form.price = cleanValue ? parseInt(cleanValue, 10) : 0;
  target.value = formatNumberWithDots(cleanValue);
};

const handleDiscountPriceInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const rawValue = target.value;
  const cleanValue = rawValue.replace(/\D/g, '');
  form.discountPrice = cleanValue ? parseInt(cleanValue, 10) : 0;
  target.value = formatNumberWithDots(cleanValue);
};

const router = useRouter()
const route = useRoute()
const toast = useToast()

const isEdit = ref(false)
const isHotDeal = ref(false)
const submitting = ref(false)
const categories = ref<Category[]>([])

function handleHotDealToggle() {
  if (!isHotDeal.value) {
    form.discountPrice = 0
  } else if (form.price > 0 && form.discountPrice === 0) {
    applyPercentageDiscount(10)
  }
}

function applyPercentageDiscount(percent: number) {
  if (form.price > 0) {
    form.discountPrice = Math.round(form.price * (1 - percent / 100))
  }
}

// Image upload/URL states
const imageTab = ref<'url' | 'upload'>('url')
const tempUrl = ref('')
const imagesList = ref<string[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

const form = reactive({
  name: '',
  sku: '',
  brand: '',
  category: '',
  price: 0,
  discountPrice: 0,
  stock: 0,
  unit: 'cái',
  description: '',
  status: 'ACTIVE',
  isFeatured: false,
  subOptions: [] as string[],
})

const activeCategoryOptions = computed(() => {
  if (!form.category) return null
  return categories.value.find(c => c._id === form.category) || null
})
const newQuickOptionVal = ref('')

// Quick Combo addition & deletion handling
const showAddComboForm = ref(false)
const quickComboSubmitting = ref(false)
const quickComboOptionInput = ref('')
const quickCombo = reactive({
  name: '',
  optionsLabel: '',
  options: [] as string[],
})

function toggleAddComboForm() {
  showAddComboForm.value = !showAddComboForm.value
  if (showAddComboForm.value) {
    quickCombo.name = ''
    quickCombo.optionsLabel = ''
    quickCombo.options = []
    quickComboOptionInput.value = ''
  }
}

function addQuickComboOption() {
  const val = quickComboOptionInput.value.trim()
  if (!val) return
  if (!quickCombo.options.includes(val)) {
    quickCombo.options.push(val)
  }
  quickComboOptionInput.value = ''
}

function removeQuickComboOption(idx: number) {
  quickCombo.options.splice(idx, 1)
}

async function submitQuickCombo() {
  const name = quickCombo.name.trim()
  if (!name) {
    toast.error('Vui lòng nhập tên combo')
    return
  }
  quickComboSubmitting.value = true
  try {
    const payload = {
      name,
      description: '',
      comboPrice: 0,
      optionsLabel: quickCombo.optionsLabel.trim() || 'Tùy Chọn',
      optionsType: quickCombo.options.length > 0 ? ('pills' as const) : ('' as const),
      options: quickCombo.options,
      status: true,
      products: [],
      parentId: null
    }

    const res = await categoryService.create(payload)
    toast.success('Tạo combo mới thành công!')
    
    // Refresh categories dropdown
    const catRes = await categoryService.getAll()
    categories.value = catRes.data
    
    // Select the newly created combo automatically
    form.category = res.data._id
    
    // Hide form
    showAddComboForm.value = false
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo combo')
  } finally {
    quickComboSubmitting.value = false
  }
}

async function deleteSelectedCombo() {
  if (!form.category) return
  const selectedCombo = categories.value.find(c => c._id === form.category)
  if (!selectedCombo) return

  if (!confirm(`Bạn có chắc chắn muốn xóa combo "${selectedCombo.name}"? Các sản phẩm thuộc combo này sẽ bị mất phân nhóm.`)) {
    return
  }

  try {
    await categoryService.delete(form.category)
    toast.success('Xóa combo thành công!')
    
    // Reset selected option
    form.category = ''
    
    // Refresh list
    const catRes = await categoryService.getAll()
    categories.value = catRes.data
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa combo')
  }
}

async function addQuickOption() {
  const val = newQuickOptionVal.value.trim()
  if (!val) return
  if (!activeCategoryOptions.value) return

  const cat = activeCategoryOptions.value
  const currentOptions = cat.options ? [...cat.options] : []
  
  if (currentOptions.includes(val)) {
    toast.warning('Phân loại này đã tồn tại!')
    return
  }

  currentOptions.push(val)
  
  try {
    const res = await categoryService.update(cat._id, {
      options: currentOptions
    })
    const catIdx = categories.value.findIndex(c => c._id === cat._id)
    if (catIdx !== -1) {
      categories.value[catIdx] = res.data
    }
    toast.success(`Đã thêm phân loại "${val}" thành công!`)
    newQuickOptionVal.value = ''
  } catch (err: any) {
    toast.error('Không thể thêm phân loại mới')
  }
}

async function removeQuickOption(optName: string) {
  if (!activeCategoryOptions.value) return
  if (!confirm(`Bạn có chắc chắn muốn xóa phân loại "${optName}" khỏi danh mục này?`)) return

  const cat = activeCategoryOptions.value
  const currentOptions = cat.options ? cat.options.filter(o => o !== optName) : []

  try {
    const res = await categoryService.update(cat._id, {
      options: currentOptions
    })
    const catIdx = categories.value.findIndex(c => c._id === cat._id)
    if (catIdx !== -1) {
      categories.value[catIdx] = res.data
    }
    form.subOptions = form.subOptions.filter(o => o !== optName)
    toast.success(`Đã xóa phân loại "${optName}"!`)
  } catch (err: any) {
    toast.error('Không thể xóa phân loại')
  }
}

onMounted(() => {
  categoryService.getAll()
    .then(catRes => {
      categories.value = catRes.data
    })
    .catch(err => {
      console.error('Error fetching categories', err)
    })

  const id = route.params.id as string
  if (id) {
    isEdit.value = true
    productService.getById(id)
      .then(prodRes => {
        const data = prodRes.data
        form.name = data.name
        form.sku = data.sku
        form.brand = data.brand || ''
        form.category = typeof data.category === 'object' ? data.category._id : data.category
        form.price = data.price
        form.discountPrice = data.discountPrice || 0
        isHotDeal.value = (data.discountPrice || 0) > 0
        form.stock = data.stock
        form.unit = data.unit || 'cái'
        form.description = data.description || ''
        form.status = data.status
        form.isFeatured = data.isFeatured || false
        form.subOptions = data.subOptions || []
        imagesList.value = data.images || []
      })
      .catch(err => {
        toast.error('Lỗi khi tải thông tin sản phẩm')
        router.push('/admin/products')
      })
  }
})

async function handleSubmit() {
  submitting.value = true
  try {
    const finalImages = imagesList.value.filter(url => url.trim() !== '')
    const payload = {
      ...form,
      discountPrice: isHotDeal.value ? form.discountPrice : 0,
      images: finalImages.length > 0 ? finalImages : ['https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'],
    }

    if (isEdit.value) {
      const id = route.params.id as string
      await productService.update(id, payload)
      toast.success('Cập nhật sản phẩm thành công!')
    } else {
      await productService.create(payload)
      toast.success('Tạo sản phẩm mới thành công!')
    }
    router.push('/admin/products')
  } catch (err: any) {
    toast.error(err.message || 'Lưu sản phẩm thất bại')
  } finally {
    submitting.value = false
  }
}

// Image handling helper functions
function addImageUrl() {
  if (tempUrl.value.trim()) {
    imagesList.value.push(tempUrl.value.trim())
    tempUrl.value = ''
    toast.success('Đã thêm link ảnh thành công')
  }
}

function removeImage(idx: number) {
  imagesList.value.splice(idx, 1)
  toast.success('Đã xóa ảnh')
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files) {
    processFiles(files)
  }
}

function handleFileDrop(e: DragEvent) {
  const files = e.dataTransfer?.files
  if (files) {
    processFiles(files)
  }
}

function processFiles(files: FileList) {
  let count = 0
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file.type.startsWith('image/')) {
      toast.warning(`File ${file.name} không phải định dạng ảnh và đã bị bỏ qua.`)
      continue
    }
    count++
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        imagesList.value.push(event.target.result)
      }
    }
    reader.readAsDataURL(file)
  }
  if (count > 0) {
    toast.success(`Đang xử lý ${count} ảnh...`)
  }
}
</script>
