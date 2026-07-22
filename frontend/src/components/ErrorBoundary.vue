<template>
  <div v-if="error" class="min-h-[400px] flex items-center justify-center p-6 bg-slate-50">
    <div class="max-w-md w-full bg-white border border-red-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
      <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl">
        ⚠️
      </div>
      <h3 class="text-lg font-bold text-slate-800">Đã xảy ra lỗi không mong muốn</h3>
      <p class="text-xs text-slate-500 leading-relaxed">
        Rất tiếc, đã có sự cố xảy ra khi tải phần giao diện này. Vui lòng thử tải lại trang hoặc quay về trang chủ.
      </p>
      <div class="flex items-center justify-center gap-3 pt-2">
        <button
          @click="resetError"
          class="px-5 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          Thử lại
        </button>
        <router-link
          to="/"
          class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors inline-block"
        >
          Trang chủ
        </router-link>
      </div>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err as Error
  return false // prevent error from bubbling further
})

function resetError() {
  error.value = null
}
</script>
