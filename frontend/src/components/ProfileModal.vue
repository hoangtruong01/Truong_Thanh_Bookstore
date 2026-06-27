<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
    @click.self="closeModal"
  >
    <div
      class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100 flex flex-col border border-slate-100"
    >
      <!-- Header -->
      <div class="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-[#dc2626]"></span>
          Hồ sơ cá nhân
        </h3>
        <button
          @click="closeModal"
          class="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-6 overflow-y-auto">
        <!-- Avatar Section -->
        <div class="flex flex-col items-center justify-center space-y-3">
          <div class="relative group">
            <div class="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-150 shadow-md bg-slate-100 flex items-center justify-center">
              <img
                v-if="avatarPreview || form.avatar"
                :src="avatarPreview || form.avatar"
                class="w-full h-full object-cover"
                alt="Avatar"
              />
              <span v-else class="text-3xl font-black text-[#dc2626]">
                {{ initials }}
              </span>
            </div>

            <!-- Upload Overlay Button -->
            <button
              @click="triggerFileInput"
              class="absolute inset-0 bg-slate-900/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-white text-[10px] font-bold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 mb-1">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              Thay ảnh
            </button>
          </div>

          <input
            type="file"
            ref="fileInput"
            accept="image/*"
            class="hidden"
            @change="handleFileChange"
          />
          <p class="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">
            Định dạng JPG, PNG, WEBP. Tối đa 5MB.
          </p>
        </div>

        <!-- Form Fields -->
        <div class="space-y-4 text-left">
          <!-- Full Name -->
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Họ và tên</label>
            <input
              type="text"
              v-model="form.fullName"
              placeholder="Nhập họ và tên..."
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626] transition-all font-medium text-slate-700"
            />
          </div>

          <!-- Email (Read Only) -->
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Địa chỉ Email</label>
            <input
              type="email"
              :value="form.email"
              readonly
              class="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-slate-400 focus:outline-none font-medium select-none cursor-not-allowed"
            />
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Số điện thoại</label>
            <input
              type="tel"
              v-model="form.phone"
              placeholder="Nhập số điện thoại..."
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626] transition-all font-medium text-slate-700"
            />
          </div>

          <!-- Role -->
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vai trò tài khoản</label>
            <div class="flex">
              <span
                class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
                :class="roleClass"
              >
                {{ roleLabel }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
        <button
          @click="closeModal"
          class="px-4.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          @click="saveProfile"
          :disabled="saving"
          class="px-5 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <span v-if="saving" class="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
          <span>Lưu thông tin</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const authStore = useAuthStore()
const toast = useToast()

const fileInput = ref<HTMLInputElement | null>(null)
const saving = ref(false)
const avatarPreview = ref('')
const avatarBase64 = ref('')

const form = ref({
  fullName: '',
  email: '',
  phone: '',
  avatar: '',
  role: ''
})

// Compute initials when no avatar is set
const initials = computed(() => {
  const name = form.value.fullName || 'User'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})

const roleLabel = computed(() => {
  if (form.value.role === 'ADMIN') return 'Super Admin'
  if (form.value.role === 'STAFF') return 'Nhân viên'
  return 'Khách hàng'
})

const roleClass = computed(() => {
  if (form.value.role === 'ADMIN') return 'bg-purple-600'
  if (form.value.role === 'STAFF') return 'bg-blue-600'
  return 'bg-emerald-600'
})

// Sync form with authStore when modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal && authStore.user) {
    form.value = {
      fullName: authStore.user.fullName || '',
      email: authStore.user.email || '',
      phone: authStore.user.phone || '',
      avatar: authStore.user.avatar || '',
      role: authStore.user.role || ''
    }
    avatarPreview.value = ''
    avatarBase64.value = ''
  }
})

function closeModal() {
  emit('close')
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('File quá lớn, vui lòng chọn file dưới 5MB.')
    return
  }

  // Create preview url
  avatarPreview.value = URL.createObjectURL(file)

  // Convert to base64
  const reader = new FileReader()
  reader.onload = (e: any) => {
    avatarBase64.value = e.target.result
  }
  reader.readAsDataURL(file)
}

async function saveProfile() {
  if (!form.value.fullName) {
    toast.warning('Vui lòng nhập họ và tên.')
    return
  }

  saving.value = true
  try {
    const payload: any = {
      fullName: form.value.fullName,
      phone: form.value.phone
    }

    if (avatarBase64.value) {
      payload.avatar = avatarBase64.value
    }

    await authStore.updateProfile(payload)
    toast.success('Cập nhật thông tin tài khoản thành công!')
    closeModal()
  } catch (error: any) {
    toast.error('Lỗi khi cập nhật hồ sơ: ' + (error.response?.data?.message || error.message || error))
  } finally {
    saving.value = false
  }
}
</script>
