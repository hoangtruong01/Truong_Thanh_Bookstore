<template>
  <div class="space-y-3">
    <div v-if="label" class="flex justify-between items-center">
      <label class="text-xs font-bold text-slate-700">{{ label }}</label>
      <span class="text-[10px] text-slate-400 font-medium">Tối đa {{ maxSizeBytes / (1024 * 1024) }}MB / ảnh</span>
    </div>

    <!-- Image Previews Grid -->
    <div v-if="previewList.length > 0" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      <div
        v-for="(url, index) in previewList"
        :key="index"
        class="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs"
      >
        <img :src="url" class="w-full h-full object-cover" alt="Preview" />
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
          <button
            type="button"
            @click="removeImage(index)"
            class="w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
            title="Xóa ảnh"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Add more box if multiple allowed and below max -->
      <button
        v-if="multiple && previewList.length < maxImages"
        type="button"
        @click="triggerFileInput"
        class="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-red-400 hover:bg-red-50/20 text-slate-400 hover:text-red-600 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span class="text-[10px] font-bold">Thêm ảnh</span>
      </button>
    </div>

    <!-- Dropzone Box (when empty or for primary drop) -->
    <div
      v-if="previewList.length === 0"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="triggerFileInput"
      :class="[
        'border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2',
        isDragging ? 'border-red-500 bg-red-50/40' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
      ]"
    >
      <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      </div>
      <div>
        <p class="text-xs font-bold text-slate-700">Kéo thả ảnh vào đây hoặc <span class="text-red-600 hover:underline">Chọn tệp</span></p>
        <p class="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP, AVIF (Tối đa {{ maxSizeBytes / (1024 * 1024) }}MB)</p>
      </div>
    </div>

    <!-- Hidden native file input -->
    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      :accept="acceptedFormats"
      :multiple="multiple"
      @change="onFileSelected"
    />

    <!-- Direct URL fallback input (optional) -->
    <div v-if="allowUrlInput" class="flex gap-2">
      <input
        v-model="manualUrl"
        type="url"
        placeholder="Hoặc dán URL hình ảnh trực tiếp..."
        class="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
        @keydown.enter.prevent="addManualUrl"
      />
      <button
        type="button"
        @click="addManualUrl"
        class="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
      >
        Thêm URL
      </button>
    </div>

    <p v-if="errorMessage" class="text-[10px] text-red-500 font-semibold">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string | string[]
    label?: string
    multiple?: boolean
    maxImages?: number
    maxSizeBytes?: number
    allowUrlInput?: boolean
    acceptedFormats?: string
  }>(),
  {
    label: '',
    multiple: false,
    maxImages: 6,
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowUrlInput: true,
    acceptedFormats: 'image/jpeg,image/png,image/webp,image/avif',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string | string[]): void
  (e: 'upload-file', file: File): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const manualUrl = ref('')
const errorMessage = ref('')

const previewList = computed<string[]>(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.filter(Boolean)
  }
  return props.modelValue ? [props.modelValue] : []
})

function triggerFileInput() {
  fileInputRef.value?.click()
}

function validateFile(file: File): boolean {
  errorMessage.value = ''
  const accepted = props.acceptedFormats.split(',').map(value => value.trim().toLowerCase())
  if (!accepted.some(format => format.startsWith('.')
    ? file.name.toLowerCase().endsWith(format)
    : format.endsWith('/*') ? file.type.startsWith(format.slice(0, -1)) : file.type === format)) {
    errorMessage.value = 'Định dạng ảnh không được hỗ trợ'
    return false
  }
  if (file.size > props.maxSizeBytes) {
    errorMessage.value = `Ảnh "${file.name}" vượt quá dung lượng cho phép (${props.maxSizeBytes / (1024 * 1024)}MB)`
    return false
  }
  return true
}

function onFileSelected(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return
  handleFiles(Array.from(files))
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return
  handleFiles(Array.from(files))
}

let readingFiles = false
async function handleFiles(files: File[]) {
  if (readingFiles) return
  const capacity = props.multiple ? props.maxImages - previewList.value.length : 1
  if (files.length > capacity) {
    errorMessage.value = `Chỉ có thể chọn thêm ${capacity} ảnh`
    return
  }
  if (!files.every(validateFile)) return
  readingFiles = true
  try {
    const urls = await Promise.all(files.map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Không thể đọc ảnh'))
      reader.onabort = () => reject(new Error('Đã hủy đọc ảnh'))
      reader.readAsDataURL(file)
    })))
    const next = props.multiple ? [...previewList.value, ...urls].slice(0, props.maxImages) : urls[0] || ''
    emit('update:modelValue', next)
    files.forEach(file => emit('upload-file', file))
  } catch {
    errorMessage.value = 'Không thể đọc ảnh. Vui lòng thử lại.'
  } finally {
    readingFiles = false
  }
}

function addManualUrl() {
  const url = manualUrl.value.trim()
  if (!url) return
  try {
    if (!['http:', 'https:'].includes(new URL(url).protocol)) throw new Error('Invalid URL')
  } catch {
    errorMessage.value = 'URL ảnh phải bắt đầu bằng http:// hoặc https://'
    return
  }
  errorMessage.value = ''
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    if (current.length < props.maxImages) {
      current.push(url)
      emit('update:modelValue', current)
    }
  } else {
    emit('update:modelValue', url)
  }
  manualUrl.value = ''
}

function removeImage(index: number) {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    current.splice(index, 1)
    emit('update:modelValue', current)
  } else {
    emit('update:modelValue', '')
  }
}
</script>
