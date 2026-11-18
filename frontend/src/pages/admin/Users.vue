<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div>
        <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Quản lý nhân viên & phân quyền</h2>
        <p class="text-[11px] text-slate-400 font-semibold mt-0.5">
          Quản trị tài khoản nhân sự, phân bổ quyền hạn nghiệp vụ theo vai trò và kiểm soát trạng thái hoạt động.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 bg-[#dc2626] hover:bg-red-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        @click="openCreateModal"
      >
        <span>+ Thêm nhân viên mới</span>
      </button>
    </div>

    <!-- FilterBar -->
    <FilterBar
      v-model="searchQuery"
      v-model:active-tab="currentTab"
      :tabs="tabs"
      placeholder="Tìm kiếm theo họ tên, email, số điện thoại..."
      @tab-change="onTabChange"
    />

    <!-- Users DataTable -->
    <DataTable
      :columns="columns"
      :items="users"
      :loading="loading"
      :pagination="true"
      :current-page="currentPage"
      :total-items="totalUsers"
      :page-size="pageSize"
      empty-text="Chưa có người dùng nào."
      empty-subtext="Không tìm thấy tài khoản người dùng nào phù hợp với bộ lọc."
      @page-change="onPageChange"
    >
      <!-- User info -->
      <template #cell(user)="{ row }">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs uppercase flex-shrink-0">
            <img v-if="row.avatar" :src="row.avatar" class="w-full h-full rounded-full object-cover" alt="" />
            <span v-else>{{ row.fullName ? row.fullName.charAt(0) : 'U' }}</span>
          </div>
          <div class="min-w-0">
            <p class="font-bold text-slate-900 truncate">{{ row.fullName || 'Chưa đặt tên' }}</p>
            <p class="text-[10px] text-slate-400 font-mono truncate">{{ row.email }}</p>
          </div>
        </div>
      </template>

      <!-- Phone -->
      <template #cell(phone)="{ row }">
        <span class="text-slate-600 font-mono text-[11px]">{{ row.phone || '—' }}</span>
      </template>

      <!-- Role -->
      <template #cell(role)="{ row }">
        <span
          class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
          :class="getRoleBadgeClass(row.role)"
        >
          {{ getRoleLabel(row.role) }}
        </span>
      </template>

      <!-- Permissions -->
      <template #cell(permissions)="{ row }">
        <div v-if="row.role === 'SUPER_ADMIN' || row.role === 'ADMIN'" class="text-[10px] text-emerald-600 font-bold">
          Toàn quyền hệ thống
        </div>
        <div v-else-if="row.role === 'CUSTOMER'" class="text-[10px] text-slate-400">
          Khách mua lẻ
        </div>
        <div v-else class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            {{ row.permissions?.length || 0 }} quyền hạn
          </span>
          <button
            type="button"
            class="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
            @click="openPermissionsModal(row)"
          >
            Chỉnh sửa
          </button>
        </div>
      </template>

      <!-- Status -->
      <template #cell(status)="{ row }">
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
          :class="row.status !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="row.status !== false ? 'bg-emerald-500' : 'bg-rose-500'"></span>
          {{ row.status !== false ? 'Hoạt động' : 'Đã khóa' }}
        </span>
      </template>

      <!-- Created At -->
      <template #cell(createdAt)="{ row }">
        <span class="text-slate-500 text-[11px]">{{ formatDate(row.createdAt) }}</span>
      </template>

      <!-- Actions -->
      <template #cell(actions)="{ row }">
        <div class="flex items-center justify-end gap-2">
          <!-- Role button -->
          <button
            type="button"
            class="text-indigo-600 hover:text-indigo-800 font-bold text-xs cursor-pointer"
            title="Đổi vai trò"
            @click="openRoleModal(row)"
          >
            Đổi vai trò
          </button>

          <!-- Toggle status -->
          <button
            type="button"
            class="font-bold text-xs cursor-pointer"
            :class="row.status !== false ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'"
            @click="toggleUserStatus(row)"
          >
            {{ row.status !== false ? 'Khóa' : 'Mở khóa' }}
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Modal: Thêm Nhân Viên Mới -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Thêm nhân viên mới</h3>
          <button
            type="button"
            class="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
            @click="showCreateModal = false"
          >
            ✕
          </button>
        </div>

        <form class="flex-1 overflow-y-auto p-6 space-y-4 text-xs" @submit.prevent="submitCreateStaff">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Họ và tên *</label>
              <input
                v-model="createForm.fullName"
                type="text"
                required
                placeholder="VD: Nguyễn Văn A"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Email đăng nhập *</label>
              <input
                v-model="createForm.email"
                type="email"
                required
                placeholder="nhanvien@truongthanh.vn"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Mật khẩu khởi tạo *</label>
              <input
                v-model="createForm.password"
                type="password"
                required
                minlength="8"
                placeholder="Tối thiểu 8 ký tự, 1 hoa, 1 số"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Số điện thoại</label>
              <input
                v-model="createForm.phone"
                type="text"
                placeholder="0901234567"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
              />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Vai trò *</label>
            <select
              v-model="createForm.role"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
            >
              <option value="STAFF">Nhân viên (STAFF)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
            </select>
          </div>

          <div v-if="createForm.role === 'STAFF'" class="space-y-3 pt-2 border-t border-slate-100">
            <div class="flex items-center justify-between">
              <label class="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Phân quyền hạn nghiệp vụ</label>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                  @click="selectAllPermissions"
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  class="text-[10px] text-slate-400 font-bold hover:underline cursor-pointer"
                  @click="clearAllPermissions"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            <div class="space-y-4">
              <div
                v-for="grp in PERMISSION_GROUPS"
                :key="grp.name"
                class="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3 space-y-2"
              >
                <p class="font-extrabold text-slate-800 text-[11px]">{{ grp.name }}</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    v-for="p in grp.permissions"
                    :key="p.key"
                    class="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900"
                  >
                    <input
                      v-model="createForm.permissions"
                      type="checkbox"
                      :value="p.key"
                      class="rounded border-slate-300 text-[#dc2626] focus:ring-[#dc2626]"
                    />
                    <span class="text-[11px] font-medium">{{ p.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              class="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              @click="showCreateModal = false"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2 font-extrabold bg-[#dc2626] hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {{ submitting ? 'Đang tạo...' : 'Tạo tài khoản' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Phân Quyền Hạn -->
    <div v-if="showPermissionsModal && targetUser" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Cập nhật quyền hạn nhân viên</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Tài khoản: <strong class="text-slate-700">{{ targetUser.fullName }}</strong> ({{ targetUser.email }})</p>
          </div>
          <button
            type="button"
            class="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
            @click="showPermissionsModal = false"
          >
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-slate-500 font-medium">Đã chọn: <strong class="text-indigo-600">{{ targetPermissions.length }}</strong> quyền</span>
            <div class="flex gap-2">
              <button
                type="button"
                class="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                @click="selectAllTargetPermissions"
              >
                Chọn tất cả
              </button>
              <button
                type="button"
                class="text-[10px] text-slate-400 font-bold hover:underline cursor-pointer"
                @click="clearAllTargetPermissions"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <div
              v-for="grp in PERMISSION_GROUPS"
              :key="grp.name"
              class="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3 space-y-2"
            >
              <p class="font-extrabold text-slate-800 text-[11px]">{{ grp.name }}</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  v-for="p in grp.permissions"
                  :key="p.key"
                  class="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900"
                >
                  <input
                    v-model="targetPermissions"
                    type="checkbox"
                    :value="p.key"
                    class="rounded border-slate-300 text-[#dc2626] focus:ring-[#dc2626]"
                  />
                  <span class="text-[11px] font-medium">{{ p.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            class="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            @click="showPermissionsModal = false"
          >
            Hủy
          </button>
          <button
            type="button"
            :disabled="submitting"
            class="px-5 py-2 font-extrabold bg-[#dc2626] hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            @click="submitUpdatePermissions"
          >
            {{ submitting ? 'Đang lưu...' : 'Lưu quyền hạn' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Đổi Vai Trò -->
    <div v-if="showRoleModal && targetUser" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Đổi vai trò người dùng</h3>
          <button
            type="button"
            class="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
            @click="showRoleModal = false"
          >
            ✕
          </button>
        </div>

        <p class="text-slate-600">
          Người dùng: <strong class="text-slate-900">{{ targetUser.fullName }}</strong> ({{ targetUser.email }})
        </p>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Chọn vai trò mới</label>
          <select
            v-model="targetRole"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
          >
            <option value="STAFF">Nhân viên (STAFF)</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
            <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
          </select>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            class="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            @click="showRoleModal = false"
          >
            Hủy
          </button>
          <button
            type="button"
            :disabled="submitting"
            class="px-5 py-2 font-extrabold bg-[#dc2626] hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            @click="submitUpdateRole"
          >
            {{ submitting ? 'Đang lưu...' : 'Xác nhận' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { userService } from '@/services/user.service'
import { formatDate } from '@/utils/helpers'
import type { User } from '@/types'
import FilterBar, { type FilterTab } from '@/components/FilterBar.vue'
import DataTable, { type TableColumn } from '@/components/DataTable.vue'

const toast = useToast()

const users = ref<User[]>([])
const loading = ref(true)
const submitting = ref(false)
const searchQuery = ref('')
const currentTab = ref('ALL')

const currentPage = ref(1)
const pageSize = ref(10)
const totalUsers = ref(0)

const tabs: FilterTab[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'STAFF', label: 'Nhân viên' },
  { value: 'ADMIN', label: 'Quản trị viên' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'CUSTOMER', label: 'Khách hàng' },
]

const columns: TableColumn[] = [
  { key: 'user', label: 'NGƯỜI DÙNG' },
  { key: 'phone', label: 'SỐ ĐIỆN THOẠI' },
  { key: 'role', label: 'VAI TRÒ' },
  { key: 'permissions', label: 'QUYỀN HẠN' },
  { key: 'status', label: 'TRẠNG THÁI' },
  { key: 'createdAt', label: 'NGÀY TẠO' },
  { key: 'actions', label: 'HÀNH ĐỘNG', align: 'right' },
]

const PERMISSION_GROUPS = [
  {
    name: 'Bán hàng & Đơn hàng',
    permissions: [
      { key: 'MANAGE_ORDERS', label: 'Quản lý đơn hàng' },
      { key: 'MANAGE_CUSTOMERS', label: 'Quản lý khách hàng' },
      { key: 'POS_ACCESS', label: 'Truy cập POS quầy' },
      { key: 'POS_VIEW_ORDERS', label: 'POS - Xem đơn hàng' },
      { key: 'POS_REFUND', label: 'POS - Hoàn tiền' },
      { key: 'POS_VIEW_REPORTS', label: 'POS - Xem báo cáo' },
      { key: 'POS_CANCEL', label: 'POS - Hủy đơn quầy' },
      { key: 'POS_OVERRIDE_DISCOUNT', label: 'POS - Giảm giá đặc biệt' },
    ],
  },
  {
    name: 'Sản phẩm & Giá bán',
    permissions: [
      { key: 'MANAGE_PRODUCTS', label: 'Quản lý sản phẩm & Combo' },
      { key: 'MANAGE_PRICING', label: 'Quản lý chính sách giá' },
    ],
  },
  {
    name: 'Kho hàng & Thu mua',
    permissions: [
      { key: 'MANAGE_INVENTORY', label: 'Quản lý kho & Nhập/Xuất' },
    ],
  },
  {
    name: 'Tài chính & Báo cáo',
    permissions: [
      { key: 'VIEW_REPORTS', label: 'Xem báo cáo doanh thu' },
      { key: 'MANAGE_FINANCE', label: 'Quản lý sổ quỹ & Dòng tiền' },
      { key: 'VIEW_DOCUMENTS', label: 'Xem chứng từ kế toán' },
      { key: 'MANAGE_DOCUMENTS', label: 'Quản lý chứng từ kế toán' },
    ],
  },
  {
    name: 'Tiếp thị & Khuyến mãi',
    permissions: [
      { key: 'MANAGE_PROMOTIONS', label: 'Quản lý khuyến mãi & Voucher' },
      { key: 'MANAGE_BANNERS', label: 'Quản lý banner trang chủ' },
      { key: 'MANAGE_LANDING_PAGES', label: 'Quản lý trang đích' },
    ],
  },
]

const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key))

// Create staff state
const showCreateModal = ref(false)
const createForm = ref({
  fullName: '',
  email: '',
  password: '',
  phone: '',
  role: 'STAFF',
  permissions: [] as string[],
})

// Permissions edit state
const showPermissionsModal = ref(false)
const targetUser = ref<User | null>(null)
const targetPermissions = ref<string[]>([])

// Role edit state
const showRoleModal = ref(false)
const targetRole = ref('STAFF')

onMounted(fetchUsers)

async function fetchUsers() {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
    }
    if (currentTab.value !== 'ALL') {
      params.role = currentTab.value
    }
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }
    const res: any = await userService.getAll(params)
    const data = res?.data?.data || (Array.isArray(res?.data) ? res.data : [])
    users.value = data
    totalUsers.value = res?.data?.total !== undefined ? res.data.total : data.length
  } catch {
    toast.error('Lỗi khi tải danh sách người dùng')
  } finally {
    loading.value = false
  }
}

let searchTimeout: any = null
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchUsers()
  }, 350)
})

function onPageChange(page: number) {
  currentPage.value = page
  fetchUsers()
}

function onTabChange(tabVal: string) {
  currentTab.value = tabVal
  currentPage.value = 1
  fetchUsers()
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin'
    case 'ADMIN':
      return 'Quản trị viên'
    case 'STAFF':
      return 'Nhân viên'
    case 'CUSTOMER':
      return 'Khách hàng'
    default:
      return role
  }
}

function getRoleBadgeClass(role: string) {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'bg-purple-100 text-purple-800 border border-purple-200'
    case 'ADMIN':
      return 'bg-red-100 text-red-800 border border-red-200'
    case 'STAFF':
      return 'bg-blue-100 text-blue-800 border border-blue-200'
    case 'CUSTOMER':
      return 'bg-slate-100 text-slate-700 border border-slate-200'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function openCreateModal() {
  createForm.value = {
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'STAFF',
    permissions: [],
  }
  showCreateModal.value = true
}

function selectAllPermissions() {
  createForm.value.permissions = [...ALL_PERMISSION_KEYS]
}

function clearAllPermissions() {
  createForm.value.permissions = []
}

async function submitCreateStaff() {
  if (submitting.value) return
  submitting.value = true
  try {
    const payload: any = {
      fullName: createForm.value.fullName.trim(),
      email: createForm.value.email.trim(),
      password: createForm.value.password,
      role: createForm.value.role,
    }
    if (createForm.value.phone.trim()) {
      payload.phone = createForm.value.phone.trim()
    }
    if (createForm.value.role === 'STAFF') {
      payload.permissions = createForm.value.permissions
    }
    await userService.createStaff(payload)
    toast.success('Đã tạo tài khoản nhân viên thành công')
    showCreateModal.value = false
    fetchUsers()
  } catch (err: any) {
    toast.error(err.message || 'Tạo tài khoản thất bại')
  } finally {
    submitting.value = false
  }
}

function openPermissionsModal(user: User) {
  targetUser.value = user
  targetPermissions.value = [...(user.permissions || [])]
  showPermissionsModal.value = true
}

function selectAllTargetPermissions() {
  targetPermissions.value = [...ALL_PERMISSION_KEYS]
}

function clearAllTargetPermissions() {
  targetPermissions.value = []
}

async function submitUpdatePermissions() {
  if (submitting.value || !targetUser.value) return
  submitting.value = true
  try {
    await userService.updatePermissions(targetUser.value._id, targetPermissions.value)
    toast.success('Cập nhật quyền hạn thành công')
    showPermissionsModal.value = false
    fetchUsers()
  } catch (err: any) {
    toast.error(err.message || 'Cập nhật quyền hạn thất bại')
  } finally {
    submitting.value = false
  }
}

function openRoleModal(user: User) {
  targetUser.value = user
  targetRole.value = user.role
  showRoleModal.value = true
}

async function submitUpdateRole() {
  if (submitting.value || !targetUser.value) return
  submitting.value = true
  try {
    await userService.updateRole(targetUser.value._id, targetRole.value)
    toast.success('Cập nhật vai trò thành công')
    showRoleModal.value = false
    fetchUsers()
  } catch (err: any) {
    toast.error(err.message || 'Cập nhật vai trò thất bại')
  } finally {
    submitting.value = false
  }
}

async function toggleUserStatus(user: User) {
  const newStatus = user.status === false
  const actionText = newStatus ? 'mở khóa' : 'khóa'
  if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản "${user.fullName || user.email}"?`)) {
    return
  }
  try {
    await userService.updateStatus(user._id, newStatus)
    toast.success(`Đã ${actionText} tài khoản thành công`)
    fetchUsers()
  } catch (err: any) {
    toast.error(err.message || `Thao tác ${actionText} thất bại`)
  }
}
</script>
