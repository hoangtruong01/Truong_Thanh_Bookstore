<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <div class="text-center max-w-md">
      <!-- 404 Illustration -->
      <div class="mb-8 relative">
        <div class="text-[120px] sm:text-[160px] font-black text-slate-100 leading-none select-none">404</div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border-2 border-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 text-[#dc2626]">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
        </div>
      </div>

      <h1 class="text-2xl font-black text-slate-800 mb-3">Không tìm thấy trang</h1>
      <p class="text-sm text-slate-500 mb-8 leading-relaxed">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <router-link
          to="/"
          class="inline-flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Về trang chủ
        </router-link>
        <router-link
          to="/products"
          class="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm px-6 py-3 rounded-xl transition-colors border border-slate-200"
        >
          Xem sản phẩm
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 404 Not Found page
</script>
