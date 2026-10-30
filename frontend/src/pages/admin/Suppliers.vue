<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-extrabold text-slate-900">ERP-01: Quản lý nhà cung cấp</h2>
        <p class="text-xs text-slate-500 font-medium">
          Quản lý thông tin nhà cung cấp, thông tin liên hệ và theo dõi lịch sử giá mua của từng mặt hàng.
        </p>
      </div>
      <button
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-[#dc2626] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        @click="openCreateModal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Thêm nhà cung cấp</span>
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
      <div class="relative w-full sm:w-80">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm tên, mã NCC, SĐT..."
          class="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-red-500"
          @keyup.enter="fetchSuppliers"
        />
        <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <select
          v-model="statusFilter"
          class="text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
          @change="fetchSuppliers"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hợp tác</option>
          <option value="INACTIVE">Ngừng hợp tác</option>
        </select>

        <button
          class="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          @click="fetchSuppliers"
        >
          Lọc
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <th class="p-4">Mã NCC</th>
              <th class="p-4">Tên nhà cung cấp</th>
              <th class="p-4">Liên hệ</th>
              <th class="p-4">Địa chỉ / MST</th>
              <th class="p-4">Sản phẩm</th>
              <th class="p-4">Trạng thái</th>
              <th class="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading" class="text-center">
              <td colspan="7" class="p-8 text-slate-400">Đang tải danh sách nhà cung cấp...</td>
            </tr>
            <tr v-else-if="suppliers.length === 0" class="text-center">
              <td colspan="7" class="p-8 text-slate-400">Chưa có nhà cung cấp nào phù hợp.</td>
            </tr>
            <tr v-for="sup in suppliers" :key="sup._id" class="hover:bg-slate-50/60 transition-colors">
              <td class="p-4 font-mono font-bold text-slate-700">
                <span class="px-2 py-1 bg-slate-100 rounded-md border border-slate-200">{{ sup.code }}</span>
              </td>
              <td class="p-4">
                <p class="font-extrabold text-slate-900">{{ sup.name }}</p>
                <p v-if="sup.contactPerson" class="text-[11px] text-slate-500 font-medium">Đại diện: {{ sup.contactPerson }}</p>
              </td>
              <td class="p-4">
                <p class="font-bold text-slate-800">{{ sup.phone }}</p>
                <p v-if="sup.email" class="text-[11px] text-slate-400">{{ sup.email }}</p>
              </td>
              <td class="p-4 max-w-xs truncate">
                <p class="text-slate-700 truncate">{{ sup.address || '—' }}</p>
                <p v-if="sup.taxCode" class="text-[10px] text-slate-400 font-mono">MST: {{ sup.taxCode }}</p>
              </td>
              <td class="p-4">
                <button
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer"
                  @click="openProductHistoryModal(sup)"
                >
                  <span>{{ (sup.suppliedProducts && sup.suppliedProducts.length) || 0 }} SKU</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </td>
              <td class="p-4">
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border"
                  :class="[
                    sup.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  ]"
                >
                  {{ sup.status === 'ACTIVE' ? 'Đang hợp tác' : 'Ngừng hợp tác' }}
                </span>
              </td>
              <td class="p-4 text-right space-x-1.5">
                <button
                  class="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  title="Chỉnh sửa"
                  @click="openEditModal(sup)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  class="p-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                  title="Xóa mềm"
                  @click="handleDelete(sup)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="p-4 border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs text-slate-500">Trang {{ page }} / {{ totalPages }} (Tổng {{ total }} NCC)</span>
        <div class="flex gap-1">
          <button
            :disabled="page <= 1"
            class="px-3 py-1.5 text-xs rounded-lg border border-slate-200 disabled:opacity-40"
            @click="changePage(page - 1)"
          >
            Trước
          </button>
          <button
            :disabled="page >= totalPages"
            class="px-3 py-1.5 text-xs rounded-lg border border-slate-200 disabled:opacity-40"
            @click="changePage(page + 1)"
          >
            Sau
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Form Thêm / Sửa -->
    <div v-if="showFormModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4">
        <h3 class="text-base font-extrabold text-slate-900">
          {{ isEditing ? 'Chỉnh sửa nhà cung cấp' : 'Thêm mới nhà cung cấp' }}
        </h3>

        <form class="space-y-3" @submit.prevent="submitForm">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Mã NCC (bỏ trống để tự sinh)</label>
            <input
              v-model="formData.code"
              type="text"
              placeholder="VD: NCC-THIENLONG hoặc bỏ trống"
              class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-mono uppercase focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Tên nhà cung cấp *</label>
            <input
              v-model="formData.name"
              type="text"
              required
              placeholder="VD: Công ty Cổ phần Thiên Long"
              class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Người đại diện</label>
              <input
                v-model="formData.contactPerson"
                type="text"
                placeholder="VD: Nguyễn Văn A"
                class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Số điện thoại *</label>
              <input
                v-model="formData.phone"
                type="text"
                required
                placeholder="VD: 0901234567"
                class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                v-model="formData.email"
                type="email"
                placeholder="contact@company.com"
                class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Mã số thuế</label>
              <input
                v-model="formData.taxCode"
                type="text"
                placeholder="MST doanh nghiệp"
                class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Địa chỉ</label>
            <input
              v-model="formData.address"
              type="text"
              placeholder="Địa chỉ trụ sở / kho của nhà cung cấp"
              class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Trạng thái</label>
              <select
                v-model="formData.status"
                class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
              >
                <option value="ACTIVE">Đang hợp tác</option>
                <option value="INACTIVE">Ngừng hợp tác</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Ghi chú</label>
              <input
                v-model="formData.notes"
                type="text"
                placeholder="Ghi chú thêm"
                class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              class="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              @click="showFormModal = false"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-4 py-2 text-xs font-bold text-white bg-[#dc2626] hover:bg-red-700 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {{ submitting ? 'Đang lưu...' : 'Lưu lại' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Xem lịch sử giá mua sản phẩm từ NCC -->
    <div v-if="showProductModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="text-base font-extrabold text-slate-900">Sản phẩm cung ứng & Lịch sử giá mua</h3>
            <p class="text-xs text-slate-500 font-medium">Nhà cung cấp: <strong class="text-slate-800">{{ selectedSupplier?.name }}</strong> ({{ selectedSupplier?.code }})</p>
          </div>
          <button class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" @click="showProductModal = false">✕</button>
        </div>

        <div class="max-h-96 overflow-y-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th class="p-3">SKU</th>
                <th class="p-3">Tên sản phẩm</th>
                <th class="p-3 text-right">Giá mua gần nhất</th>
                <th class="p-3 text-right">Lần mua gần nhất</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="!selectedSupplier?.suppliedProducts || selectedSupplier.suppliedProducts.length === 0">
                <td colspan="4" class="p-6 text-center text-slate-400">Chưa có lịch sử nhập hàng nào từ nhà cung cấp này.</td>
              </tr>
              <tr v-for="item in selectedSupplier?.suppliedProducts" :key="item.product?._id || item.product">
                <td class="p-3 font-mono font-bold text-slate-600">{{ item.product?.sku || '—' }}</td>
                <td class="p-3 font-bold text-slate-800">{{ item.product?.name || 'Sản phẩm' }}</td>
                <td class="p-3 text-right font-black text-emerald-700">{{ formatCurrency(item.lastPurchasePrice || 0) }}</td>
                <td class="p-3 text-right text-slate-500">{{ formatDate(item.lastPurchasedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end pt-2">
          <button
            class="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            @click="showProductModal = false"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supplierService } from '@/services/supplier.service'
import { useToast } from 'vue-toastification'

const toast = useToast()

const suppliers = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const totalPages = ref(1)

const showFormModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const submitting = ref(false)

const showProductModal = ref(false)
const selectedSupplier = ref<any>(null)

const formData = ref({
  code: '',
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  taxCode: '',
  status: 'ACTIVE',
  notes: '',
})

async function fetchSuppliers() {
  loading.value = true
  try {
    const res: any = await supplierService.getAll({
      page: page.value,
      limit: limit.value,
      search: searchQuery.value,
      status: statusFilter.value || undefined,
    })
    const body = res?.data || res
    suppliers.value = body?.data || []
    total.value = body?.total || 0
    totalPages.value = body?.totalPages || 1
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Không thể tải danh sách nhà cung cấp')
  } finally {
    loading.value = false
  }
}

function changePage(newPage: number) {
  page.value = newPage
  fetchSuppliers()
}

function openCreateModal() {
  isEditing.value = false
  editingId.value = null
  formData.value = {
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxCode: '',
    status: 'ACTIVE',
    notes: '',
  }
  showFormModal.value = true
}

function openEditModal(sup: any) {
  isEditing.value = true
  editingId.value = sup._id
  formData.value = {
    code: sup.code || '',
    name: sup.name || '',
    contactPerson: sup.contactPerson || '',
    phone: sup.phone || '',
    email: sup.email || '',
    address: sup.address || '',
    taxCode: sup.taxCode || '',
    status: sup.status || 'ACTIVE',
    notes: sup.notes || '',
  }
  showFormModal.value = true
}

async function submitForm() {
  submitting.value = true
  try {
    if (isEditing.value && editingId.value) {
      await supplierService.update(editingId.value, formData.value)
      toast.success('Cập nhật nhà cung cấp thành công!')
    } else {
      await supplierService.create(formData.value)
      toast.success('Thêm mới nhà cung cấp thành công!')
    }
    showFormModal.value = false
    fetchSuppliers()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu nhà cung cấp')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(sup: any) {
  if (!confirm(`Bạn có chắc muốn xóa nhà cung cấp "${sup.name}"? Hệ thống sẽ lưu trữ mềm để bảo toàn kế toán.`)) {
    return
  }
  try {
    await supplierService.delete(sup._id)
    toast.success('Đã xóa nhà cung cấp!')
    fetchSuppliers()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Không thể xóa nhà cung cấp')
  }
}

function openProductHistoryModal(sup: any) {
  selectedSupplier.value = sup
  showProductModal.value = true
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
}

function formatDate(val: string | Date | undefined) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

onMounted(() => {
  fetchSuppliers()
})
</script>
