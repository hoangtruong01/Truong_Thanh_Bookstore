<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        @click="handleBackdropClick"
      >
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div
            v-if="modelValue"
            ref="modalRef"
            role="dialog"
            aria-modal="true"
            tabindex="-1"
            class="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full overflow-hidden flex flex-col max-h-[90vh] outline-none"
            :class="sizeClass"
            @click.stop
          >
            <!-- Modal Header -->
            <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
              <div>
                <h3 class="text-base font-extrabold text-slate-900 leading-tight">
                  <slot name="title">{{ title }}</slot>
                </h3>
                <p v-if="subtitle || $slots.subtitle" class="text-xs text-slate-500 font-medium mt-0.5">
                  <slot name="subtitle">{{ subtitle }}</slot>
                </p>
              </div>
              <button
                type="button"
                class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer focus:outline-none"
                aria-label="Đóng"
                @click="handleClose"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Body -->
            <div ref="contentRef" class="px-6 py-5 overflow-y-auto flex-grow space-y-4">
              <slot></slot>
            </div>

            <!-- Modal Footer -->
            <div v-if="!hideFooter" class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
              <slot name="footer">
                <button
                  type="button"
                  :disabled="loading"
                  class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  @click="handleClose"
                >
                  {{ cancelText }}
                </button>
                <button
                  type="button"
                  :disabled="loading"
                  class="px-5 py-2 text-xs font-bold bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  @click="handleSubmit"
                >
                  <svg v-if="loading" class="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ loading ? loadingText : confirmText }}</span>
                </button>
              </slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, ref, nextTick, onUnmounted } from 'vue'
import { lockModalScroll } from '../utils/modalScrollLock'

const modalRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    subtitle?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
    confirmText?: string
    cancelText?: string
    loadingText?: string
    loading?: boolean
    hideFooter?: boolean
    preventBackdropClose?: boolean
  }>(),
  {
    title: '',
    subtitle: '',
    size: 'md',
    confirmText: 'Lưu thay đổi',
    cancelText: 'Hủy bỏ',
    loadingText: 'Đang xử lý...',
    loading: false,
    hideFooter: false,
    preventBackdropClose: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'max-w-md'
    case 'lg':
      return 'max-w-2xl'
    case 'xl':
      return 'max-w-4xl'
    case '2xl':
      return 'max-w-6xl'
    case 'full':
      return 'max-w-[95vw]'
    case 'md':
    default:
      return 'max-w-lg'
  }
})

function handleClose() {
  if (props.loading) return
  emit('update:modelValue', false)
  emit('cancel')
}

function handleBackdropClick() {
  if (!props.preventBackdropClose) {
    handleClose()
  }
}

function handleSubmit() {
  if (props.loading) return
  const form = contentRef.value?.querySelector('form')
  if (form && !form.reportValidity()) return
  emit('confirm')
}

function getFocusableElements(): HTMLElement[] {
  if (!modalRef.value) return []
  const elements = modalRef.value.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  return Array.from(elements).filter(el => {
    return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement || el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'button'
  })
}

function handleKeydown(e: KeyboardEvent) {
  if (!props.modelValue) return
  if (e.key === 'Escape') {
    e.stopPropagation()
    handleClose()
    return
  }
  if (e.key === 'Tab') {
    const focusables = getFocusableElements()
    if (!focusables.length) {
      e.preventDefault()
      return
    }
    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first || !modalRef.value?.contains(document.activeElement)) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last || !modalRef.value?.contains(document.activeElement)) {
        e.preventDefault()
        first.focus()
      }
    }
  }
}

let triggerElement: HTMLElement | null = null
let releaseScroll: (() => void) | undefined

watch(
  () => props.modelValue,
  async (open) => {
    releaseScroll?.()
    if (open) {
      if (typeof document !== 'undefined') {
        triggerElement = document.activeElement as HTMLElement | null
        window.addEventListener('keydown', handleKeydown)
      }
      releaseScroll = lockModalScroll()
      await nextTick()
      const focusables = getFocusableElements()
      if (focusables.length > 0) {
        const firstInput = contentRef.value?.querySelector<HTMLElement>(
          'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])'
        )
        if (firstInput) {
          firstInput.focus()
        } else {
          focusables[0].focus()
        }
      } else {
        modalRef.value?.focus()
      }
    } else {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeydown)
      }
      releaseScroll = undefined
      if (triggerElement && typeof triggerElement.focus === 'function') {
        triggerElement.focus()
        triggerElement = null
      }
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
  releaseScroll?.()
})
</script>
