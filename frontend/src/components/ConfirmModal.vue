<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" @click="handleCancel"></div>

    <!-- Modal Content -->
    <div class="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl z-10 space-y-6 text-center transform transition-all animate-in fade-in zoom-in-95 duration-200">
      <!-- Icon Indicator -->
      <div 
        class="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-sm"
        :class="{
          'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400': variant === 'danger',
          'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400': variant === 'warning',
          'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400': variant === 'primary'
        }"
      >
        <span v-if="variant === 'danger'">⚠️</span>
        <span v-else-if="variant === 'warning'">⚡</span>
        <span v-else>ℹ️</span>
      </div>

      <!-- Text -->
      <div class="space-y-2">
        <h3 class="text-lg font-black text-slate-900 dark:text-white">{{ title }}</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{{ message }}</p>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 pt-2">
        <button
          type="button"
          @click="handleCancel"
          :disabled="loading"
          class="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          @click="handleConfirm"
          :disabled="loading"
          class="flex-1 py-3 px-4 rounded-xl text-xs font-black text-white transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          :class="{
            'bg-red-600 hover:bg-red-700 shadow-red-600/20': variant === 'danger',
            'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20': variant === 'warning',
            'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20': variant === 'primary'
          }"
        >
          <span v-if="loading" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span>{{ confirmText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Xác nhận thao tác',
  message: 'Bạn có chắc chắn muốn thực hiện hành động này không?',
  confirmText: 'Xác nhận',
  cancelText: 'Hủy bỏ',
  variant: 'danger',
  loading: false,
});

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

function handleConfirm() {
  emit('confirm');
}

function handleCancel() {
  if (!props.loading) {
    emit('cancel');
  }
}
</script>
