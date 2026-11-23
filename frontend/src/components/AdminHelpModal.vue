<template>
  <teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
      @click.self="close"
    >
      <div
        class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        <!-- Modal Header -->
        <div class="px-6 py-4.5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-900/40 shadow-2xs">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Hỗ trợ & Hướng dẫn ERP</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Trường Thành Bookstore & Office Supplies</p>
            </div>
          </div>
          <button
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            @click="close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-5 overflow-y-auto">
          <!-- Phím tắt nhanh -->
          <div class="space-y-2.5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Phím tắt nhanh</h4>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                <span class="text-slate-600 dark:text-slate-300 font-medium">Tìm kiếm chức năng</span>
                <kbd class="px-2 py-0.5 text-[11px] font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-md shadow-2xs">Ctrl + K</kbd>
              </div>
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                <span class="text-slate-600 dark:text-slate-300 font-medium">Đóng cửa sổ / Thoát</span>
                <kbd class="px-2 py-0.5 text-[11px] font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-md shadow-2xs">Esc</kbd>
              </div>
            </div>
          </div>

          <!-- Kênh hỗ trợ kỹ thuật -->
          <div class="space-y-2.5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Kênh hỗ trợ kỹ thuật</h4>
            <div class="space-y-2">
              <div class="flex items-center gap-3 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-150 dark:border-blue-900/40">
                <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-4.5 h-4.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                </div>
                <div class="min-w-0 text-xs">
                  <p class="font-bold text-slate-800 dark:text-slate-200">Hotline hỗ trợ trực tuyến: <span class="text-blue-600 dark:text-blue-400">0988.234.567</span></p>
                  <p class="text-slate-500 dark:text-slate-400 text-[11px]">Hoạt động: 8:00 – 21:00 (Thứ 2 – Chủ nhật)</p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs">
                <div class="w-8 h-8 rounded-lg bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-4.5 h-4.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <p class="font-medium text-slate-800 dark:text-slate-200">Hòm thư kỹ thuật: <span class="font-semibold text-slate-700 dark:text-slate-300">support@truongthanhbookstore.vn</span></p>
                  <p class="text-slate-400 text-[11px]">Phản hồi yêu cầu trong vòng 2 giờ làm việc</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Thông tin hệ thống -->
          <div class="pt-2 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Trường Thành ERP Suite</span>
            <span class="font-semibold text-slate-500 dark:text-slate-400">Phiên bản 2.4.0</span>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-3 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-end">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            @click="close"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function close() {
  emit('close')
}
</script>
