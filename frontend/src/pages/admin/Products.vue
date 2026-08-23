<template>
  <div class="space-y-6">
    <!-- Header with Action (Matches Screenshot & Enhanced with Excel features) -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div class="space-y-1">
        <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Danh sách sản phẩm</h2>
        <p class="text-[11px] text-slate-400 font-semibold">Quản lý kho hàng, thông tin sản phẩm và giá cả bán lẻ.</p>
      </div>
      <div class="flex items-center gap-2.5 flex-wrap">
        <!-- Download Template Button -->
        <button
          @click="downloadTemplate"
          :disabled="downloadingTemplate"
          class="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-bold py-2 px-3.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Tải file Excel mẫu chuẩn cấu trúc để nhập sản phẩm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-emerald-600">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <span>{{ downloadingTemplate ? 'Đang tải mẫu...' : 'Tải file mẫu' }}</span>
        </button>

        <!-- Export Excel Button -->
        <button
          @click="exportExcel"
          :disabled="exporting"
          class="border border-red-200 text-[#dc2626] bg-white hover:bg-red-50 font-bold py-2 px-3.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Xuất toàn bộ danh sách sản phẩm hiện tại ra file Excel"
        >
          <svg v-if="!exporting" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          <svg v-else class="animate-spin w-4 h-4 text-[#dc2626]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span>{{ exporting ? 'Đang xuất...' : 'Xuất Excel' }}</span>
        </button>

        <!-- Import Excel Button -->
        <button
          @click="openImportModal"
          class="border border-red-200 text-[#dc2626] bg-white hover:bg-red-50 font-bold py-2 px-3.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Nhập sản phẩm từ file Excel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
          <span>Nhập Excel</span>
        </button>

        <!-- Create Product Button -->
        <router-link to="/admin/products/create" class="bg-[#dc2626] hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          <span>Thêm sản phẩm</span>
        </router-link>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row gap-4 shadow-xs">
      <div class="flex-grow">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm kiếm sản phẩm theo tên, SKU, thương hiệu..."
          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white transition-all placeholder:text-slate-400"
          @input="handleSearch"
        />
      </div>
      <div class="w-full md:w-48">
        <select
          v-model="selectedCategory"
          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white text-slate-600 transition-all font-medium"
          @change="handleCategoryChange"
        >
          <option value="">Tất cả danh mục</option>
          <template v-for="parent in parentCategories" :key="parent._id">
            <option :value="parent._id" class="font-bold text-slate-900">
              {{ parent.name }}
            </option>
            <option
              v-for="sub in getSubcategories(parent._id)"
              :key="sub._id"
              :value="sub._id"
              class="text-slate-600"
            >
              &nbsp;&nbsp;&nbsp;&nbsp;↳ {{ sub.name }}
            </option>
          </template>
        </select>
      </div>
      <div class="w-full md:w-48">
        <select
          v-model="dealFilter"
          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white text-slate-600 transition-all"
          @change="handleDealFilterChange"
        >
          <option value="">Tất cả sản phẩm</option>
          <option value="discounted">Chỉ Deal Sốc Giờ Vàng</option>
        </select>
      </div>
    </div>

    <!-- Products Table -->
    <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      <div v-if="loading" class="p-8 animate-pulse space-y-4">
        <div v-for="n in 5" :key="n" class="h-12 bg-slate-100 rounded-xl w-full"></div>
      </div>

      <div v-else-if="products.length === 0" class="p-16 text-center space-y-4">
        <h3 class="text-sm font-bold text-slate-800">Không tìm thấy sản phẩm nào</h3>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
              <th class="py-4 px-6">Sản phẩm</th>
              <th class="py-4 px-6">SKU</th>
              <th class="py-4 px-6">Giá</th>
              <th class="py-4 px-6">Kho</th>
              <th class="py-4 px-6">Đã bán</th>
              <th class="py-4 px-6">Trạng thái</th>
              <th class="py-4 px-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-150 font-medium text-slate-800">
            <tr v-for="prod in products" :key="prod._id" class="hover:bg-slate-50/50">
              <!-- Product Image Circular Colored Box (Matches Screenshot) -->
              <td class="py-4 px-6 flex items-center gap-3">
                <img v-if="prod.images && prod.images.length > 0" :src="prod.images[0]" class="w-10 h-10 rounded-full object-cover border border-slate-100 flex-shrink-0" />
                <div v-else :class="['w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-[15px] flex-shrink-0 shadow-xs', getProductPlaceholder(prod.name).gradient]">
                  <svg v-if="getProductPlaceholder(prod.name).icon === 'pencil'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-white/90">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                  <svg v-else-if="getProductPlaceholder(prod.name).icon === 'document'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-white/90">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <svg v-else-if="getProductPlaceholder(prod.name).icon === 'calculator'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-white/90">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008ZM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.379-3.379a.75.75 0 0 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06-1.06l-1.25-1.25Z" />
                  </svg>
                  <svg v-else-if="getProductPlaceholder(prod.name).icon === 'folder'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-white/90">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25m-19.5 0v.225C2.25 14.28 3.52 15 5.04 15h13.92c1.52 0 2.79-.72 2.79-2.025v-.225M3 9V6a3 3 0 0 1 3-3h3.75a3 3 0 0 1 2.25 1.025L13.5 6h6.75A3 3 0 0 1 23 9v2.25m-20.25 0h17.5" />
                  </svg>
                  <span v-else>{{ prod.name.charAt(0).toUpperCase() }}</span>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <p class="font-extrabold truncate max-w-[200px] text-slate-800 leading-tight">{{ prod.name }}</p>
                    <span v-if="prod.discountPrice > 0" class="bg-red-50 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0" title="Sản phẩm đang chạy Deal Sốc Giờ Vàng">
                      🔥 DEAL SỐC
                    </span>
                  </div>
                  <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    {{ getProductCategoryName(prod) }}
                  </p>
                </div>
              </td>
              <td class="py-4 px-6 font-mono text-[10px] font-bold text-slate-500">{{ prod.sku }}</td>
              <td class="py-4 px-6">
                <div class="flex flex-col">
                  <template v-if="prod.discountPrice > 0">
                    <span class="font-extrabold text-red-600">
                      {{ formatCurrency(prod.discountPrice) }}
                    </span>
                    <span class="line-through text-[10px] text-slate-400 font-medium">
                      {{ formatCurrency(prod.price) }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="font-extrabold text-red-600">
                      {{ formatCurrency(prod.price) }}
                    </span>
                  </template>
                </div>
              </td>
              <td class="py-4 px-6">
                <span :class="[prod.stock <= 10 ? 'text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded' : 'text-slate-700']">{{ prod.stock }} {{ prod.unit || 'cái' }}</span>
              </td>
              <td class="py-4 px-6 text-slate-600 font-bold">{{ prod.sold }}</td>
              <td class="py-4 px-6 whitespace-nowrap">
                <span :class="['px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide', getProductStatusStyle(prod.status)]">
                  {{ getProductStatusLabel(prod.status) }}
                </span>
              </td>
              <td class="py-4 px-6 text-right space-x-3 whitespace-nowrap">
                <router-link :to="`/admin/products/${prod._id}/edit`" class="text-blue-600 hover:text-blue-800 inline-block font-extrabold">
                  Sửa
                </router-link>
                <button @click="deleteProduct(prod._id)" class="text-red-500 hover:text-red-700 inline-block font-extrabold cursor-pointer">
                  Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center items-center gap-2">
      <button
        @click="changePage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50 text-xs font-bold"
      >
        Trước
      </button>
      <span class="text-xs font-semibold text-slate-500">
        Trang {{ currentPage }} / {{ totalPages }}
      </span>
      <button
        @click="changePage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50 text-xs font-bold"
      >
        Sau
      </button>
    </div>

    <!-- MODAL NHẬP EXCEL HOÀN CHỈNH -->
    <div
      v-if="showImportModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden transform transition-all flex flex-col max-h-[90vh]"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-red-50 text-[#dc2626] flex items-center justify-center font-black">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Nhập sản phẩm từ file Excel</h3>
              <p class="text-[11px] text-slate-400 font-medium mt-0.5">Tự động đối chiếu mã SKU, loại bỏ trùng lặp và đồng bộ tồn kho</p>
            </div>
          </div>
          <button
            @click="closeImportModal"
            class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div class="p-6 overflow-y-auto space-y-5 flex-1">
          <!-- GIAI ĐOẠN 1: CHỌN FILE VÀ TẢI MẪU (KHI CHƯA CÓ KẾT QUẢ) -->
          <template v-if="!importResult">
            <!-- Box Tải File Mẫu Chuẩn -->
            <div class="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                  XLSX
                </div>
                <div>
                  <h4 class="text-xs font-bold text-emerald-950">Chưa có file mẫu nhập liệu?</h4>
                  <p class="text-[11px] text-emerald-700 mt-0.5">File mẫu gồm 3 sheet có sẵn danh mục và quy tắc định dạng chuẩn.</p>
                </div>
              </div>
              <button
                @click="downloadTemplate"
                :disabled="downloadingTemplate"
                class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                <span>{{ downloadingTemplate ? 'Đang tải...' : 'Tải file mẫu (.xlsx)' }}</span>
              </button>
            </div>

            <!-- Drag & Drop Zone -->
            <div
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
              @click="triggerFileInput"
              :class="[
                'border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3',
                isDragging ? 'border-[#dc2626] bg-red-50/50 scale-[0.99]' : 'border-slate-300 hover:border-red-400 bg-slate-50/50 hover:bg-red-50/20'
              ]"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept=".xlsx, .xls"
                class="hidden"
                @change="handleFileChange"
              />

              <template v-if="!selectedFile">
                <div class="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-7 h-7 text-[#dc2626]">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-700">Kéo & thả file Excel (.xlsx, .xls) vào đây hoặc <span class="text-[#dc2626] underline">duyệt từ máy tính</span></p>
                  <p class="text-[11px] text-slate-400 mt-1">Dung lượng tối đa cho phép: 10MB</p>
                </div>
              </template>

              <!-- File đã được chọn -->
              <template v-else>
                <div class="w-full bg-white border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 shadow-xs" @click.stop>
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-extrabold text-xs">
                      XLS
                    </div>
                    <div class="text-left min-w-0">
                      <p class="text-xs font-bold text-slate-800 truncate">{{ selectedFile.name }}</p>
                      <p class="text-[10px] text-slate-400 font-medium">{{ formatFileSize(selectedFile.size) }} • Sẵn sàng tải lên</p>
                    </div>
                  </div>
                  <button
                    @click.stop="clearSelectedFile"
                    class="text-xs text-red-500 hover:text-red-700 font-bold px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                  >
                    Đổi file khác
                  </button>
                </div>
              </template>
            </div>

            <!-- Ghi chú nghiệp vụ & Quy tắc chống trùng lặp -->
            <div class="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 space-y-1.5 text-slate-700 text-xs">
              <div class="flex items-center gap-2 font-bold text-amber-900">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-amber-600 shrink-0">
                  <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
                </svg>
                <span>Cơ chế kiểm tra trùng lặp & Bỏ qua (Duplicate Check)</span>
              </div>
              <ul class="text-[11px] text-amber-800 space-y-1 pl-6 list-disc">
                <li>Hệ thống đối chiếu theo <strong>Mã SKU</strong>. Những sản phẩm <strong>đã có sẵn trong kho</strong> sẽ <strong>TỰ ĐỘNG BỎ QUA / TỪ CHỐI</strong> tải lại để bảo vệ tính toàn vẹn dữ liệu.</li>
                <li>Những sản phẩm <strong>chưa có trong kho</strong> sẽ được <strong>THÊM MỚI</strong> và tự động liên kết danh mục + tồn kho.</li>
                <li>Sau khi xử lý xong, hệ thống sẽ thống kê đầy đủ số lượng thêm mới, số lượng bị từ chối và các dòng lỗi.</li>
              </ul>
            </div>
          </template>

          <!-- GIAI ĐOẠN 2: BÁO CÁO KẾT QUẢ SAU KHI NHẬP EXCEL (IMPORT SUMMARY DASHBOARD) -->
          <template v-else>
            <!-- Banner thông báo kết quả -->
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-1">
              <h4 class="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Báo cáo kết quả xử lý file</h4>
              <p class="text-xs text-slate-600">{{ importResult.message }}</p>
            </div>

            <!-- 3 Thẻ thống kê số lượng (Cards) -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <!-- Card Thêm Mới Thành Công -->
              <div
                @click="activeResultTab = 'created'"
                :class="[
                  'p-4 rounded-2xl border transition-all cursor-pointer text-center space-y-1',
                  activeResultTab === 'created'
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                ]"
              >
                <p class="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Thêm mới thành công</p>
                <p class="text-2xl font-black text-emerald-600">{{ importResult.summary.createdCount }}</p>
                <p class="text-[10px] text-emerald-600/80 font-medium">Sản phẩm mới đã vào kho</p>
              </div>

              <!-- Card Đã Bỏ Qua / Trùng Lặp -->
              <div
                @click="activeResultTab = 'skipped'"
                :class="[
                  'p-4 rounded-2xl border transition-all cursor-pointer text-center space-y-1',
                  activeResultTab === 'skipped'
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                ]"
              >
                <p class="text-[10px] font-bold uppercase tracking-wider text-amber-700">Bỏ qua (Đã tồn tại)</p>
                <p class="text-2xl font-black text-amber-600">{{ importResult.summary.skippedCount }}</p>
                <p class="text-[10px] text-amber-600/80 font-medium">Từ chối tải lại tránh trùng SKU</p>
              </div>

              <!-- Card Lỗi Dòng -->
              <div
                @click="activeResultTab = 'errors'"
                :class="[
                  'p-4 rounded-2xl border transition-all cursor-pointer text-center space-y-1',
                  activeResultTab === 'errors'
                    ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                ]"
              >
                <p class="text-[10px] font-bold uppercase tracking-wider text-rose-700">Dòng bị lỗi</p>
                <p class="text-2xl font-black text-rose-600">{{ importResult.summary.errorCount }}</p>
                <p class="text-[10px] text-rose-600/80 font-medium">Thiếu tên, SKU hoặc sai giá</p>
              </div>
            </div>

            <!-- Tab Switcher -->
            <div class="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                @click="activeResultTab = 'created'"
                :class="[
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                  activeResultTab === 'created' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                ]"
              >
                <span>Thêm mới ({{ importResult.summary.createdCount }})</span>
              </button>
              <button
                @click="activeResultTab = 'skipped'"
                :class="[
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                  activeResultTab === 'skipped' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                ]"
              >
                <span>Bỏ qua do đã có ({{ importResult.summary.skippedCount }})</span>
              </button>
              <button
                @click="activeResultTab = 'errors'"
                :class="[
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                  activeResultTab === 'errors' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                ]"
              >
                <span>Dòng bị lỗi ({{ importResult.summary.errorCount }})</span>
              </button>
            </div>

            <!-- Tab Content (Scrollable list) -->
            <div class="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              <!-- Tab 1: Danh sách sản phẩm thêm mới -->
              <div v-if="activeResultTab === 'created'">
                <div v-if="importResult.details.created.length === 0" class="p-8 text-center text-xs text-slate-400">
                  Không có sản phẩm nào được thêm mới trong lượt nhập này.
                </div>
                <table v-else class="w-full text-left text-xs border-collapse">
                  <thead class="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th class="py-2.5 px-4">Dòng</th>
                      <th class="py-2.5 px-4">SKU</th>
                      <th class="py-2.5 px-4">Tên sản phẩm</th>
                      <th class="py-2.5 px-4">Danh mục</th>
                      <th class="py-2.5 px-4">Giá bán</th>
                      <th class="py-2.5 px-4 text-right">Tồn kho</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="item in importResult.details.created" :key="item.row" class="hover:bg-emerald-50/40">
                      <td class="py-2.5 px-4 font-mono font-bold text-slate-400">#{{ item.row }}</td>
                      <td class="py-2.5 px-4 font-mono font-bold text-emerald-700">{{ item.sku }}</td>
                      <td class="py-2.5 px-4 font-bold text-slate-800">{{ item.name }}</td>
                      <td class="py-2.5 px-4 text-slate-500">{{ item.category }}</td>
                      <td class="py-2.5 px-4 font-bold text-red-600">{{ formatCurrency(item.price) }}</td>
                      <td class="py-2.5 px-4 font-bold text-slate-700 text-right">{{ item.stock }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Tab 2: Danh sách sản phẩm bị bỏ qua do đã có -->
              <div v-else-if="activeResultTab === 'skipped'">
                <div v-if="importResult.details.skipped.length === 0" class="p-8 text-center text-xs text-slate-400">
                  Không có sản phẩm nào bị bỏ qua.
                </div>
                <table v-else class="w-full text-left text-xs border-collapse">
                  <thead class="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th class="py-2.5 px-4">Dòng</th>
                      <th class="py-2.5 px-4">SKU</th>
                      <th class="py-2.5 px-4">Tên sản phẩm</th>
                      <th class="py-2.5 px-4">Lý do từ chối</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="item in importResult.details.skipped" :key="item.row" class="hover:bg-amber-50/40">
                      <td class="py-2.5 px-4 font-mono font-bold text-slate-400">#{{ item.row }}</td>
                      <td class="py-2.5 px-4 font-mono font-bold text-amber-700">{{ item.sku }}</td>
                      <td class="py-2.5 px-4 font-bold text-slate-800">{{ item.name }}</td>
                      <td class="py-2.5 px-4 text-amber-700 font-medium text-[11px]">{{ item.reason }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Tab 3: Danh sách dòng bị lỗi -->
              <div v-else-if="activeResultTab === 'errors'">
                <div v-if="importResult.details.errors.length === 0" class="p-8 text-center text-xs text-emerald-600 font-bold">
                  Tuyệt vời! Không có dòng nào bị lỗi định dạng.
                </div>
                <table v-else class="w-full text-left text-xs border-collapse">
                  <thead class="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th class="py-2.5 px-4">Dòng</th>
                      <th class="py-2.5 px-4">SKU / Tên</th>
                      <th class="py-2.5 px-4">Chi tiết lỗi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="item in importResult.details.errors" :key="item.row" class="hover:bg-rose-50/40">
                      <td class="py-2.5 px-4 font-mono font-bold text-rose-600">#{{ item.row }}</td>
                      <td class="py-2.5 px-4 font-bold text-slate-800">
                        <span>{{ item.name || item.sku || '(Trống)' }}</span>
                      </td>
                      <td class="py-2.5 px-4 text-rose-600 font-medium text-[11px]">{{ item.reason }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <!-- Khi đang ở bước chọn file -->
          <template v-if="!importResult">
            <button
              @click="closeImportModal"
              :disabled="importing"
              class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              @click="handleImportExcel"
              :disabled="!selectedFile || importing"
              class="bg-[#dc2626] hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="importing" class="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span>{{ importing ? 'Đang phân tích & nhập dữ liệu...' : 'Bắt đầu tải lên & Xử lý' }}</span>
            </button>
          </template>

          <!-- Khi đã có kết quả báo cáo -->
          <template v-else>
            <button
              @click="resetImportForm"
              class="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Nhập tiếp file khác
            </button>
            <button
              @click="finishImport"
              class="bg-[#dc2626] hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-xs"
            >
              Hoàn tất & Cập nhật danh sách
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import { formatCurrency } from '@/utils/helpers'
import type { Product, Category } from '@/types'

const toast = useToast()

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)

const parentCategories = computed(() => {
  return categories.value.filter(c => !c.parentId)
})

function isComboCategory(cat: any): boolean {
  if (!cat) return false
  const name = (cat.name || '').toLowerCase()
  const slug = (cat.slug || '').toLowerCase()
  return name === 'combo' || slug === 'combo' || name.startsWith('combo') || slug.startsWith('combo')
}

function getSubcategories(parentId: string) {
  const parent = categories.value.find(c => c._id === parentId)
  // Don't show individual combo subcategories in the category filter dropdown
  if (parent && isComboCategory(parent)) {
    return []
  }
  return categories.value.filter(c => {
    if (!c.parentId) return false
    const pId = typeof c.parentId === 'object' ? (c.parentId as any)._id : c.parentId
    return pId === parentId && !isComboCategory(c)
  })
}

function getProductCategoryName(prod: any): string {
  if (!prod.category) return 'Khác'
  if (typeof prod.category === 'string') return prod.category
  if (prod.category.parentId && typeof prod.category.parentId === 'object' && prod.category.parentId.name) {
    return prod.category.parentId.name
  }
  if (prod.category.name && prod.category.name.toLowerCase().startsWith('combo')) {
    return 'Combo'
  }
  return prod.category.name || 'Khác'
}

function handleCategoryChange() {
  currentPage.value = 1
  fetchProducts()
}

function handleDealFilterChange() {
  currentPage.value = 1
  fetchProducts()
}

const searchQuery = ref('')
const selectedCategory = ref('')
const dealFilter = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const limit = 10

// State cho Xuất / Nhập Excel
const exporting = ref(false)
const downloadingTemplate = ref(false)
const showImportModal = ref(false)
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const importing = ref(false)
const importResult = ref<any | null>(null)
const activeResultTab = ref<'created' | 'skipped' | 'errors'>('created')
const fileInputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  categoryService.getAll()
    .then(catRes => {
      categories.value = catRes.data
    })
    .catch(err => {
      console.error('Error fetching categories', err)
    })
  fetchProducts()
})

async function fetchProducts() {
  loading.value = true
  try {
    const res: any = await productService.getAll({
      page: currentPage.value,
      limit,
      q: searchQuery.value || undefined,
      category: selectedCategory.value || undefined,
      discounted: dealFilter.value === 'discounted' ? true : undefined,
    })
    const items = Array.isArray(res.data) ? res.data : (res.data?.data || [])
    products.value = items
    totalPages.value = res.meta?.totalPages || res.data?.totalPages || 1
  } catch (err) {
    toast.error('Lỗi khi tải danh sách sản phẩm')
  } finally {
    loading.value = false
  }
}

let searchTimeout: any
function handleSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchProducts()
  }, 350)
}

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchProducts()
  }
}

async function deleteProduct(id: string) {
  if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return
  try {
    await productService.delete(id)
    toast.success('Xóa sản phẩm thành công')
    fetchProducts()
  } catch (err) {
    toast.error('Lỗi khi xóa sản phẩm')
  }
}

/**
 * Tải file Excel mẫu (.xlsx) chuẩn cấu trúc
 */
async function downloadTemplate() {
  downloadingTemplate.value = true
  try {
    const res: any = await productService.downloadTemplate()
    const rawData = res.data !== undefined ? res.data : res
    const blob = rawData instanceof Blob ? rawData : new Blob([rawData], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Mau_nhap_san_pham_TruongThanh.xlsx')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    toast.success('Tải file Excel mẫu thành công!')
  } catch (err: any) {
    console.error('Lỗi tải file mẫu:', err)
    let msg = err?.response?.data?.message || err?.message || 'Không thể tải file mẫu. Vui lòng thử lại!'
    if (err?.response?.data instanceof Blob) {
      try {
        const txt = await err.response.data.text()
        const json = JSON.parse(txt)
        if (json.message) msg = json.message
      } catch {}
    }
    toast.error(msg)
  } finally {
    downloadingTemplate.value = false
  }
}

/**
 * Xuất toàn bộ danh sách sản phẩm hiện có ra file Excel (.xlsx)
 */
async function exportExcel() {
  exporting.value = true
  try {
    toast.info('Đang chuẩn bị xuất file Excel danh sách sản phẩm...')
    const res: any = await productService.exportExcel()
    const rawData = res.data !== undefined ? res.data : res
    const blob = rawData instanceof Blob ? rawData : new Blob([rawData], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const dateStr = new Date().toISOString().slice(0, 10)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Danh_sach_san_pham_${dateStr}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    toast.success('Xuất file Excel danh sách sản phẩm thành công!')
  } catch (err: any) {
    console.error('Lỗi xuất Excel:', err)
    let msg = err?.response?.data?.message || err?.message || 'Lỗi khi xuất file Excel!'
    if (err?.response?.data instanceof Blob) {
      try {
        const txt = await err.response.data.text()
        const json = JSON.parse(txt)
        if (json.message) msg = json.message
      } catch {}
    }
    toast.error(msg)
  } finally {
    exporting.value = false
  }
}

/**
 * Mở modal Nhập Excel
 */
function openImportModal() {
  selectedFile.value = null
  importResult.value = null
  isDragging.value = false
  activeResultTab.value = 'created'
  showImportModal.value = true
}

function closeImportModal() {
  if (importing.value) return
  showImportModal.value = false
}

function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    validateAndSetFile(file)
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer && event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0]
    validateAndSetFile(file)
  }
}

function validateAndSetFile(file: File) {
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    toast.error('Vui lòng chọn file Excel có đuôi .xlsx hoặc .xls')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.error('Dung lượng file vượt quá giới hạn cho phép (10MB)')
    return
  }
  selectedFile.value = file
}

function clearSelectedFile() {
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function resetImportForm() {
  selectedFile.value = null
  importResult.value = null
  activeResultTab.value = 'created'
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

/**
 * Gửi file Excel lên backend để parse, validate và import
 */
async function handleImportExcel() {
  if (!selectedFile.value) {
    toast.warning('Vui lòng chọn file Excel để tải lên')
    return
  }

  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const res: any = await productService.importExcel(formData)
    importResult.value = res.data || res

    // Ưu tiên hiển thị tab có dữ liệu
    if (importResult.value.summary.createdCount > 0) {
      activeResultTab.value = 'created'
    } else if (importResult.value.summary.skippedCount > 0) {
      activeResultTab.value = 'skipped'
    } else {
      activeResultTab.value = 'errors'
    }

    toast.success(importResult.value.message || 'Xử lý file Excel hoàn tất!')
  } catch (err: any) {
    console.error('Lỗi nhập Excel:', err)
    toast.error(err?.response?.data?.message || err?.message || 'Lỗi khi nhập file Excel')
  } finally {
    importing.value = false
  }
}

function finishImport() {
  showImportModal.value = false
  selectedFile.value = null
  importResult.value = null
  fetchProducts()
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getProductStatusStyle(status: string) {
  return status === 'ACTIVE' || status === 'active' || status === 'true' || status === 'ACTIVE'
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
    : 'bg-slate-100 text-slate-600 border border-slate-200'
}

function getProductStatusLabel(status: string) {
  return status === 'ACTIVE' || status === 'active' || status === 'true' || status === 'ACTIVE'
    ? 'Đang bán'
    : 'Ngừng bán'
}

function getProductPlaceholder(prodName?: string) {
  const name = (prodName || '').toLowerCase()
  if (name.includes('bút') || name.includes('viết') || name.includes('chì')) {
    return {
      gradient: 'bg-gradient-to-br from-red-400 to-rose-500',
      icon: 'pencil'
    }
  }
  if (name.includes('giấy') || name.includes('sổ') || name.includes('vở') || name.includes('tập') || name.includes('note')) {
    return {
      gradient: 'bg-gradient-to-br from-emerald-400 to-teal-500',
      icon: 'document'
    }
  }
  if (name.includes('máy tính') || name.includes('casio')) {
    return {
      gradient: 'bg-gradient-to-br from-indigo-400 to-purple-500',
      icon: 'calculator'
    }
  }
  if (name.includes('hồ sơ') || name.includes('bìa') || name.includes('kẹp') || name.includes('keo') || name.includes('thước')) {
    return {
      gradient: 'bg-gradient-to-br from-blue-400 to-sky-500',
      icon: 'folder'
    }
  }
  return {
    gradient: 'bg-gradient-to-br from-pink-400 to-rose-500',
    icon: 'tag'
  }
}
</script>
