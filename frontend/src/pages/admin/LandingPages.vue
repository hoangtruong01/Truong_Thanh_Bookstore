<template>
  <div class="space-y-8 font-sans pb-16">
    <!-- Header banner -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">Quản lý Landing Page AI</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">Tạo và tối ưu trang bán hàng cao cấp tự động bằng Gemini AI</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="openCreateModal"
          class="flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md transition-all cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Tạo Landing Page AI</span>
        </button>
      </div>
    </div>

    <!-- Active landing pages list -->
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <span class="text-sm font-bold text-slate-800">Danh sách Landing Pages</span>
        <span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full">{{ landingPages.length }} trang</span>
      </div>

      <div v-if="loadingList" class="p-12 text-center text-slate-500">
        <div class="animate-spin inline-block w-8 h-8 border-4 border-[#dc2626] border-t-transparent rounded-full mb-3"></div>
        <p class="text-xs font-bold">Đang tải danh sách...</p>
      </div>

      <div v-else-if="landingPages.length === 0" class="p-16 text-center">
        <div class="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-slate-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253" />
          </svg>
        </div>
        <h3 class="text-sm font-bold text-slate-700">Chưa có Landing Page nào</h3>
        <p class="text-xs text-slate-400 max-w-xs mx-auto mt-1.5 mb-6">Hãy click vào nút tạo bên trên để bắt đầu xây dựng trang bán hàng đầu tiên bằng AI!</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-wider">
              <th class="py-4.5 px-6">Ảnh</th>
              <th class="py-4.5 px-6">Tên Trang / Tiêu đề</th>
              <th class="py-4.5 px-6">Đường dẫn (Slug)</th>
              <th class="py-4.5 px-6">Khuyến mãi</th>
              <th class="py-4.5 px-6">Gói Combo</th>
              <th class="py-4.5 px-6">Trạng thái</th>
              <th class="py-4.5 px-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            <tr v-for="page in landingPages" :key="page._id" class="hover:bg-slate-50 transition-colors">
              <td class="py-4 px-6">
                <img
                  v-if="page.images && page.images.length > 0"
                  :src="page.images[0]"
                  class="w-11 h-11 rounded-lg object-cover border border-slate-200 bg-slate-50"
                />
                <div v-else class="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                  <span class="text-[9px] text-slate-400 uppercase font-bold">N/A</span>
                </div>
              </td>
              <td class="py-4 px-6 max-w-xs truncate">
                <span class="font-extrabold text-slate-900 block">{{ page.title }}</span>
                <span class="text-[10px] text-slate-400 block mt-0.5 truncate">{{ page.description }}</span>
              </td>
              <td class="py-4 px-6">
                <a
                  :href="`/t/${page.slug}`"
                  target="_blank"
                  class="text-[#dc2626] font-bold hover:underline flex items-center gap-1.5"
                >
                  <span>/t/{{ page.slug }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              </td>
              <td class="py-4 px-6">
                <div class="flex flex-col">
                  <span class="text-slate-900 font-extrabold">{{ formatMoney(page.price) }}đ</span>
                  <span class="text-[10px] text-slate-400 line-through">{{ formatMoney(page.originalPrice) }}đ</span>
                </div>
              </td>
              <td class="py-4 px-6">
                <span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-100">
                  {{ page.packages?.length || 0 }} gói
                </span>
              </td>
              <td class="py-4 px-6">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  :class="page.status ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="page.status ? 'bg-emerald-500' : 'bg-slate-400'"></span>
                  <span>{{ page.status ? 'Hoạt động' : 'Tắt' }}</span>
                </span>
              </td>
              <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openEditModal(page)"
                    class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                  </button>
                  <button
                    @click="deletePage(page._id)"
                    class="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Xóa"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- AI Generation & Customization Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden border border-slate-200 transition-all animate-in fade-in zoom-in-95 duration-200">
        <!-- Modal Header -->
        <div class="px-6 py-4.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 class="text-base font-extrabold text-slate-800">{{ isEditing ? 'Cấu hình & Tối ưu Landing Page' : 'Tạo Landing Page Bằng AI (Gemini)' }}</h2>
            <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Setup giao diện bán hàng chuyển đổi cao chỉ với hình ảnh và prompt</p>
          </div>
          <button @click="showModal = false" class="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body (Two Column Split: Config & Preview) -->
        <div class="flex-grow flex overflow-hidden">
          <!-- Left Form Column -->
          <div class="w-1/2 p-6 overflow-y-auto border-r border-slate-200 space-y-6">
            <!-- Basic Details -->
            <div class="space-y-4">
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider">Thông tin sản phẩm</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 mb-1.5">Tiêu đề Landing Page</label>
                  <input
                    v-model="form.title"
                    type="text"
                    placeholder="VD: 3 Cuốn Lịch Công Thức Tiểu Học"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#dc2626] transition-all"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 mb-1.5">Đường dẫn Slug (Unique)</label>
                  <input
                    v-model="form.slug"
                    type="text"
                    placeholder="VD: lich-cong-thuc-tieu-hoc"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#dc2626] transition-all"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 mb-1.5">Giá bán lẻ khuyến mãi (đ)</label>
                  <input
                    v-model="form.price"
                    type="number"
                    placeholder="VD: 179000"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#dc2626] transition-all"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 mb-1.5">Giá gốc thị trường (đ)</label>
                  <input
                    v-model="form.originalPrice"
                    type="number"
                    placeholder="VD: 350000"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#dc2626] transition-all"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 mb-1.5">Thời gian đếm ngược (phút)</label>
                  <input
                    v-model="form.countdownMinutes"
                    type="number"
                    placeholder="VD: 30"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#dc2626] transition-all"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 mb-1.5">Nhãn khuyến mãi</label>
                  <input
                    v-model="form.badgeText"
                    type="text"
                    placeholder="VD: GIẢM GIÁ DUY NHẤT HÔM NAY"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#dc2626] transition-all"
                  />
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-500 mb-1.5">Mô tả sản phẩm</label>
                <textarea
                  v-model="form.description"
                  rows="2"
                  placeholder="Nhập mô tả sản phẩm..."
                  class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#dc2626] transition-all"
                ></textarea>
              </div>
            </div>

            <!-- Upload Product Images -->
            <div class="space-y-4">
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Ảnh sản phẩm</span>
                <span class="text-[10px] text-slate-400">{{ form.images.length }} ảnh</span>
              </h3>
              <div class="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  class="hidden"
                  ref="fileInput"
                  @change="handleImageUpload"
                />
                <button
                  type="button"
                  @click="$refs.fileInput.click()"
                  class="mx-auto flex flex-col items-center justify-center cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-slate-400 mb-1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <span class="text-[11px] font-bold text-slate-600">Chọn ảnh sản phẩm tải lên</span>
                  <span class="text-[9px] text-slate-400 mt-0.5">Hỗ trợ JPG, PNG, WEBP. Chọn nhiều ảnh cùng lúc.</span>
                </button>
              </div>

              <!-- Images Preview Gallery -->
              <div v-if="form.images.length > 0" class="grid grid-cols-5 gap-2 mt-2">
                <div v-for="(img, idx) in form.images" :key="idx" class="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  <img :src="img" class="w-full h-full object-cover" />
                  <button
                    @click="removeImage(idx)"
                    class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-2.5 h-2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- AI Prompt & Generation Options -->
            <div class="bg-red-50/50 border border-red-100 rounded-xl p-4.5 space-y-3">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 bg-[#dc2626] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center">AI</span>
                <h4 class="text-[11px] font-black text-[#dc2626] uppercase tracking-wider">Trợ lý AI thiết kế Landing Page</h4>
              </div>
              <p class="text-[10px] text-slate-500 font-medium">
                Gemini AI sẽ tự động phân tích các hình ảnh sản phẩm bạn gửi lên để tạo nội dung lợi ích sản phẩm, thiết kế gói mua combo tối ưu, và tạo layout giao diện chất lượng.
              </p>
              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-1.5">Yêu cầu thiết kế / Prompt bổ sung (Tùy chọn)</label>
                <textarea
                  v-model="aiPrompt"
                  rows="2.5"
                  placeholder="Ví dụ: Thiết kế giao diện tone xanh lá chủ đạo, nhắm tới đối tượng là phụ huynh học sinh cấp 1, tặng thêm ebook bài tập khi mua combo..."
                  class="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] transition-all placeholder:text-slate-400"
                ></textarea>
              </div>
              <button
                type="button"
                @click="generateLandingPageAI"
                :disabled="loadingAI || form.images.length === 0"
                class="w-full py-2.5 rounded-lg text-xs font-bold text-white bg-[#dc2626] hover:bg-[#b91c1c] active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="loadingAI" class="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                <span>{{ loadingAI ? 'Đang phân tích ảnh và thiết kế giao diện...' : 'Bắt đầu tạo giao diện AI' }}</span>
              </button>
              <p v-if="form.images.length === 0" class="text-[9px] text-amber-600 text-center font-bold">⚠️ Vui lòng tải lên ít nhất 1 ảnh sản phẩm để kích hoạt AI.</p>
            </div>

            <!-- Advanced Config Details -->
            <div class="space-y-4">
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider">Cấu hình chi tiết giao diện</h3>

              <!-- Colors -->
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-[10px] font-bold text-slate-500 mb-1">Màu chủ đạo</label>
                  <div class="flex items-center gap-1.5">
                    <input type="color" v-model="form.primaryColor" class="w-6 h-6 border-0 rounded-sm cursor-pointer" />
                    <input type="text" v-model="form.primaryColor" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
                  </div>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-500 mb-1">Màu nền</label>
                  <div class="flex items-center gap-1.5">
                    <input type="color" v-model="form.backgroundColor" class="w-6 h-6 border-0 rounded-sm cursor-pointer" />
                    <input type="text" v-model="form.backgroundColor" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
                  </div>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-500 mb-1">Màu chữ</label>
                  <div class="flex items-center gap-1.5">
                    <input type="color" v-model="form.textColor" class="w-6 h-6 border-0 rounded-sm cursor-pointer" />
                    <input type="text" v-model="form.textColor" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
                  </div>
                </div>
              </div>

              <!-- Packages Config -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="block text-[11px] font-bold text-slate-600">Danh sách các gói Combo bán hàng</label>
                  <button type="button" @click="addPackage" class="text-xs font-bold text-[#dc2626] hover:underline cursor-pointer">+ Thêm gói</button>
                </div>
                <div class="space-y-2">
                  <div v-for="(pkg, idx) in form.packages" :key="idx" class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative group">
                    <button @click="removePackage(idx)" class="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div class="grid grid-cols-2 gap-2">
                      <input v-model="pkg.name" type="text" placeholder="Tên gói (Ví dụ: Mua 2 tặng 1)" class="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
                      <input v-model="pkg.badge" type="text" placeholder="Nhãn (Ví dụ: Tiết kiệm 49%)" class="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                      <input v-model.number="pkg.price" type="number" placeholder="Giá bán" class="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
                      <input v-model.number="pkg.originalPrice" type="number" placeholder="Giá gốc" class="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
                      <label class="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 justify-center">
                        <input type="checkbox" v-model="pkg.isBestSeller" class="rounded-sm" />
                        <span>Khuyên dùng</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Benefits Config -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="block text-[11px] font-bold text-slate-600">Đặc điểm / Lợi ích sản phẩm nổi bật</label>
                  <button type="button" @click="addBenefit" class="text-xs font-bold text-[#dc2626] hover:underline cursor-pointer">+ Thêm lợi ích</button>
                </div>
                <div class="space-y-2">
                  <div v-for="(bft, idx) in form.benefits" :key="idx" class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative group">
                    <button @click="removeBenefit(idx)" class="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <input v-model="bft.title" type="text" placeholder="Tiêu đề lợi ích (Ví dụ: Chính hãng 100%)" class="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
                    <textarea v-model="bft.description" rows="1" placeholder="Mô tả lợi ích..." class="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626]"></textarea>
                  </div>
                </div>
              </div>

              <!-- Custom CSS Code -->
              <div>
                <label class="block text-[11px] font-bold text-slate-500 mb-1.5">Custom CSS</label>
                <textarea
                  v-model="form.customCss"
                  rows="3"
                  placeholder=".my-class { border-radius: 99px; }"
                  class="w-full font-mono bg-slate-900 text-slate-100 border border-slate-800 rounded-lg p-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
                ></textarea>
              </div>

              <!-- Active Status -->
              <div class="flex items-center gap-2">
                <input type="checkbox" v-model="form.status" id="status" class="rounded-sm" />
                <label for="status" class="text-xs font-bold text-slate-600">Kích hoạt chế độ hoạt động công khai</label>
              </div>
            </div>
          </div>

          <!-- Right Interactive Live Preview Column -->
          <div class="w-1/2 bg-slate-100 overflow-y-auto flex flex-col">
            <!-- Header bar for preview -->
            <div class="bg-white border-b border-slate-200 py-3 px-6 flex items-center justify-between flex-shrink-0">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                <span class="text-[10px] font-bold text-slate-400 ml-1.5">LIVE PREVIEW (/t/{{ form.slug || 'slug' }})</span>
              </div>
              <div class="flex gap-2">
                <span class="text-[9px] font-black uppercase text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded bg-slate-50">Desktop/Mobile</span>
              </div>
            </div>

            <!-- Virtual Render Sandbox container -->
            <div class="flex-grow p-4 md:p-8 overflow-y-auto" :style="{ backgroundColor: form.backgroundColor, color: form.textColor }">
              <!-- Inline Custom CSS Injector -->
              <component :is="'style'" v-if="form.customCss">{{ form.customCss }}</component>

              <!-- Top Bar / Banner -->
              <div class="text-center py-2 px-4 rounded-lg font-bold text-[10px] tracking-wide mb-6 uppercase animate-pulse" :style="{ backgroundColor: form.primaryColor, color: '#ffffff' }">
                {{ form.badgeText || 'GIẢM GIÁ DUY NHẤT HÔM NAY' }}
              </div>

              <!-- Hero Section Details -->
              <div class="text-center space-y-4">
                <h1 class="text-xl md:text-2xl font-black leading-tight tracking-tight uppercase" :style="{ color: form.primaryColor }">
                  {{ form.title || 'Tên Sản Phẩm Của Bạn' }}
                </h1>
                <p class="text-xs opacity-85 leading-relaxed max-w-md mx-auto">
                  {{ form.description || 'Mô tả chi tiết sản phẩm sẽ tự động hiển thị tại đây khi AI phân tích và thiết kế.' }}
                </p>

                <!-- Mock Countdown Clock -->
                <div class="flex justify-center items-center gap-2 py-3">
                  <div v-for="unit in ['00', '29', '59', '45']" :key="unit" class="w-11 h-11 bg-white border border-slate-200/60 shadow-xs rounded-lg flex items-center justify-center font-black text-sm text-slate-800">
                    {{ unit }}
                  </div>
                </div>
              </div>

              <!-- Mock Slider / Image Gallery -->
              <div class="my-6 space-y-2">
                <div class="aspect-video w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-center">
                  <img
                    v-if="form.images.length > 0"
                    :src="form.images[currentPreviewImageIdx]"
                    class="w-full h-full object-contain"
                  />
                  <div v-else class="text-slate-400 text-xs font-bold text-center p-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="w-12 h-12 mx-auto text-slate-300 mb-2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    Chưa tải ảnh sản phẩm lên
                  </div>
                </div>

                <!-- Thumbnails -->
                <div v-if="form.images.length > 1" class="flex justify-center gap-1.5 overflow-x-auto py-1">
                  <button
                    v-for="(img, idx) in form.images"
                    :key="idx"
                    @click="currentPreviewImageIdx = idx"
                    class="w-10 h-10 rounded-md border overflow-hidden flex-shrink-0 cursor-pointer transition-all"
                    :class="currentPreviewImageIdx === idx ? 'border-2' : 'border-slate-200 opacity-60'"
                    :style="{ borderColor: currentPreviewImageIdx === idx ? form.primaryColor : '' }"
                  >
                    <img :src="img" class="w-full h-full object-cover" />
                  </button>
                </div>
              </div>

              <!-- Product Features / Benefits Section -->
              <div v-if="form.benefits.length > 0" class="my-8 space-y-4">
                <h3 class="text-xs font-black uppercase text-center tracking-wider opacity-85">Ưu điểm nổi bật</h3>
                <div class="grid grid-cols-1 gap-3">
                  <div v-for="(b, idx) in form.benefits" :key="idx" class="flex gap-3 bg-white/40 p-4.5 rounded-xl border border-white/60 backdrop-blur-xs">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white" :style="{ backgroundColor: form.primaryColor }">
                      💡
                    </div>
                    <div>
                      <h4 class="text-xs font-black text-slate-800">{{ b.title }}</h4>
                      <p class="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{{ b.description }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Packages Select Options Section -->
              <div v-if="form.packages.length > 0" class="my-8 space-y-4">
                <h3 class="text-xs font-black uppercase text-center tracking-wider opacity-85">Chọn gói combo khuyến mãi</h3>
                <div class="space-y-3">
                  <div
                    v-for="(p, idx) in form.packages"
                    :key="idx"
                    class="p-4.5 rounded-xl border-2 bg-white relative flex items-center justify-between cursor-pointer transition-all hover:scale-101 shadow-xs"
                    :style="{ borderColor: p.isBestSeller ? form.primaryColor : '#e2e8f0' }"
                  >
                    <!-- Best Seller Ribbon Badge -->
                    <span v-if="p.badge" class="absolute -top-2.5 left-4 text-[9px] font-black px-2 py-0.5 rounded-full text-white uppercase tracking-wider" :style="{ backgroundColor: form.primaryColor }">
                      {{ p.badge }}
                    </span>

                    <div class="space-y-1">
                      <span class="text-xs font-black text-slate-800">{{ p.name }}</span>
                      <div class="flex items-center gap-2 text-[10px]">
                        <span class="text-slate-400 line-through">{{ formatMoney(p.originalPrice) }}đ</span>
                        <span class="font-bold text-emerald-600">Tiết kiệm {{ Math.round((1 - p.price / p.originalPrice) * 100) }}%</span>
                      </div>
                    </div>

                    <div class="text-right">
                      <span class="text-sm font-black text-slate-900 block">{{ formatMoney(p.price) }}đ</span>
                      <span class="text-[9px] text-slate-400 font-bold uppercase block mt-0.5">MIỄN PHÍ SHIP</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Customer Checkout Order Form Section -->
              <div class="my-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-slate-800">
                <h3 class="text-xs font-black text-center uppercase tracking-wider text-slate-800">Thông tin đăng ký đặt hàng</h3>
                <div class="space-y-3">
                  <div>
                    <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Họ tên khách hàng</label>
                    <input type="text" readonly value="Nguyễn Văn A" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-400" />
                  </div>
                  <div>
                    <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Số điện thoại</label>
                    <input type="text" readonly value="0912345678" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-400" />
                  </div>
                  <div>
                    <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Địa chỉ nhận hàng</label>
                    <input type="text" readonly value="123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TPHCM" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-400" />
                  </div>
                </div>
                <button
                  type="button"
                  class="w-full py-3.5 rounded-xl text-xs font-black uppercase text-white transition-all shadow-md mt-2 flex items-center justify-center gap-1.5 animate-bounce hover:scale-102"
                  :style="{ backgroundColor: form.primaryColor }"
                >
                  Đặt mua hàng ngay
                </button>
                <span class="block text-center text-[9px] text-slate-400 font-bold">Thanh toán tiền mặt COD khi nhận hàng - Kiểm tra hàng thoải mái</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <span class="text-[10px] text-slate-400 font-bold">Vui lòng kiểm tra kỹ đường dẫn slug và thông tin trước khi lưu.</span>
          <div class="flex items-center gap-3">
            <button
              @click="showModal = false"
              class="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              @click="saveLandingPage"
              :disabled="saving"
              class="px-6 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span v-if="saving" class="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
              <span>Lưu thông tin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { landingPageService } from '@/services/landingPage';
import { useToast } from 'vue-toastification';

const toast = useToast();
const landingPages = ref<any[]>([]);
const loadingList = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const loadingAI = ref(false);
const aiPrompt = ref('');
const currentPreviewImageIdx = ref(0);

const form = ref<any>({
  title: '',
  slug: '',
  description: '',
  price: 0,
  originalPrice: 0,
  countdownMinutes: 30,
  badgeText: 'GIẢM GIÁ DUY NHẤT HÔM NAY',
  primaryColor: '#dc2626',
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
  images: [],
  packages: [],
  benefits: [],
  testimonials: [],
  customCss: '',
  status: true,
});

onMounted(() => {
  fetchLandingPages();
});

async function fetchLandingPages() {
  loadingList.value = true;
  try {
    landingPages.value = await landingPageService.getAll();
  } catch (error: any) {
    toast.error('Lỗi khi tải danh sách landing page: ' + (error.response?.data?.message || error.message));
  } finally {
    loadingList.value = false;
  }
}

function openCreateModal() {
  isEditing.value = false;
  editingId.value = null;
  aiPrompt.value = '';
  currentPreviewImageIdx.value = 0;
  form.value = {
    title: '',
    slug: '',
    description: '',
    price: 179000,
    originalPrice: 350000,
    countdownMinutes: 30,
    badgeText: 'GIẢM GIÁ DUY NHẤT HÔM NAY',
    primaryColor: '#dc2626',
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    images: [],
    packages: [
      { name: 'Mua 1 Quyển Sách', price: 99000, originalPrice: 150000, badge: 'Ưu đãi', isBestSeller: false },
      { name: 'Combo 2 Quyển Sách', price: 149000, originalPrice: 300000, badge: 'Tiết kiệm', isBestSeller: false },
      { name: 'Bộ 3 Cuốn Học Tập', price: 179000, originalPrice: 350000, badge: 'Bán chạy nhất', isBestSeller: true }
    ],
    benefits: [
      { title: 'Chính Hãng 100%', description: 'Sản phẩm từ thương hiệu sách hàng đầu Trường Thành.', icon: 'ShieldCheckIcon' },
      { title: 'Kiểm Tra Hàng Thoải Mái', description: 'Được đồng kiểm cùng shiper trước khi thanh toán tiền mặt COD.', icon: 'CheckBadgeIcon' },
      { title: 'Miễn Phí Vận Chuyển', description: 'Miễn phí giao hàng toàn quốc từ 2 sản phẩm trở lên.', icon: 'TruckIcon' }
    ],
    testimonials: [],
    customCss: '',
    status: true,
  };
  showModal.value = true;
}

function openEditModal(page: any) {
  isEditing.value = true;
  editingId.value = page._id;
  aiPrompt.value = '';
  currentPreviewImageIdx.value = 0;
  form.value = { ...page };
  showModal.value = true;
}

function addPackage() {
  form.value.packages.push({
    name: 'Combo Mới',
    price: 0,
    originalPrice: 0,
    badge: '',
    isBestSeller: false,
  });
}

function removePackage(idx: number) {
  form.value.packages.splice(idx, 1);
}

function addBenefit() {
  form.value.benefits.push({
    title: 'Đặc điểm mới',
    description: '',
    icon: 'SparklesIcon',
  });
}

function removeBenefit(idx: number) {
  form.value.benefits.splice(idx, 1);
}

function removeImage(idx: number) {
  form.value.images.splice(idx, 1);
  if (currentPreviewImageIdx.value >= form.value.images.length) {
    currentPreviewImageIdx.value = Math.max(0, form.value.images.length - 1);
  }
}

// Convert uploaded image files to base64 strings
function handleImageUpload(event: any) {
  const files: FileList = event.target.files;
  if (!files || files.length === 0) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      form.value.images.push(e.target.result);
    };
    reader.readAsDataURL(file);
  }
}

async function generateLandingPageAI() {
  if (form.value.images.length === 0) {
    toast.warning('Vui lòng tải lên ít nhất 1 ảnh sản phẩm.');
    return;
  }

  loadingAI.value = true;
  try {
    const aiConfig = await landingPageService.generate({
      title: form.value.title || 'Bộ sản phẩm Trường Thành',
      price: form.value.price || 150000,
      originalPrice: form.value.originalPrice || 300000,
      images: form.value.images,
      prompt: aiPrompt.value,
    });

    // Update form content dynamically with generated layout guidelines from AI
    form.value.description = aiConfig.description || form.value.description;
    form.value.badgeText = aiConfig.badgeText || form.value.badgeText;
    form.value.primaryColor = aiConfig.primaryColor || form.value.primaryColor;
    form.value.backgroundColor = aiConfig.backgroundColor || form.value.backgroundColor;
    form.value.textColor = aiConfig.textColor || form.value.textColor;
    form.value.benefits = aiConfig.benefits || form.value.benefits;
    form.value.packages = aiConfig.packages || form.value.packages;
    form.value.testimonials = aiConfig.testimonials || form.value.testimonials;
    form.value.customCss = aiConfig.customCss || form.value.customCss;

    if (aiConfig.isFallback) {
      toast.warning('Đang dùng giao diện mẫu do API Key chưa được kích hoạt hoặc sai. Hãy bật "Generative Language API" trên Google Cloud!', { timeout: 10000 });
    } else {
      toast.success('Đã tạo layout bán hàng tối ưu bằng AI thành công!');
    }
  } catch (error: any) {
    toast.error('Lỗi khi thiết kế giao diện bằng AI: ' + (error.response?.data?.message || error.message));
  } finally {
    loadingAI.value = false;
  }
}

async function saveLandingPage() {
  if (!form.value.title || !form.value.slug) {
    toast.warning('Vui lòng nhập đầy đủ tiêu đề và slug.');
    return;
  }

  // Auto lowercase slug and remove spaces/special characters
  form.value.slug = form.value.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  saving.value = true;
  try {
    if (isEditing.value && editingId.value) {
      await landingPageService.update(editingId.value, form.value);
      toast.success('Cập nhật Landing Page thành công!');
    } else {
      await landingPageService.create(form.value);
      toast.success('Tạo Landing Page mới thành công!');
    }
    showModal.value = false;
    fetchLandingPages();
  } catch (error: any) {
    toast.error('Lỗi khi lưu Landing Page: ' + (error.response?.data?.message || error.message));
  } finally {
    saving.value = false;
  }
}

async function deletePage(id: string) {
  if (!confirm('Bạn có chắc chắn muốn xóa trang landing page này?')) return;
  try {
    await landingPageService.delete(id);
    toast.success('Xóa trang landing page thành công');
    fetchLandingPages();
  } catch (error: any) {
    toast.error('Lỗi khi xóa landing page: ' + (error.response?.data?.message || error.message));
  }
}

function formatMoney(value: number | string): string {
  if (!value) return '0';
  const num = Number(value);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
</script>
