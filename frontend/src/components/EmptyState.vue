<template>
  <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-5">
    <div class="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-inner">
      <slot name="icon">
        <span>{{ icon }}</span>
      </slot>
    </div>
    <div class="space-y-1.5">
      <h3 class="text-base font-black text-slate-800 dark:text-white">{{ title }}</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">{{ description }}</p>
    </div>
    <div v-if="$slots.action || actionText" class="pt-2">
      <slot name="action">
        <button
          v-if="actionText"
          @click="$emit('action')"
          class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
        >
          {{ actionText }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon?: string;
  title?: string;
  description?: string;
  actionText?: string;
}

withDefaults(defineProps<Props>(), {
  icon: '📦',
  title: 'Không có dữ liệu',
  description: 'Hiện chưa có mục nào trong danh sách này.',
  actionText: '',
});

defineEmits<{
  (e: 'action'): void;
}>();
</script>
