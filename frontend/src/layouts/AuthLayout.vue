<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <!-- Top Header -->
    <header class="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between">
      <router-link to="/" class="flex items-center gap-2.5">
        <img
          src="@/assets/logo.jpg"
          class="w-9 h-9 rounded-full object-cover border border-slate-200"
          alt="Trường Thành Logo"
        />
        <div class="flex flex-col leading-none">
          <span class="text-base font-black text-[#dc2626] tracking-tight">TRƯỜNG THÀNH</span>
          <span class="text-[9px] font-bold text-slate-500 tracking-widest uppercase">Stationery</span>
        </div>
      </router-link>
      <router-link to="/" class="text-xs font-bold text-slate-600 hover:text-[#dc2626] flex items-center gap-1 transition-colors">
        <span>&larr; Quay về trang chủ</span>
      </router-link>
    </header>

    <!-- Main Content Slot -->
    <main class="flex-1 flex items-center justify-center p-4 sm:p-6">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
      &copy; {{ new Date().getFullYear() }} Trường Thành Stationery. Tất cả quyền được bảo lưu.
    </footer>
  </div>
</template>

<script setup lang="ts">
</script>
