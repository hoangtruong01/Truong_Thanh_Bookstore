<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-extrabold text-slate-900">ERP-04: Kiểm kê kho & Phê duyệt chênh lệch</h2>
        <p class="text-xs text-slate-500 font-medium">
          Tạo đợt kiểm kê, đóng băng số tồn hệ thống, ghi nhận số thực tế và phê duyệt điều chỉnh kho chống tranh chấp.
        </p>
      </div>

      <button
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-[#dc2626] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        @click="openCreateModal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Tạo đợt kiểm kê mới</span>
      </button>
    </div>

    <!-- Audits Table -->
    <div class="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <th class="p-4">Mã kiểm kê</th>
              <th class="p-4">Tiêu đề đợt kiểm</th>
              <th class="p-4 text-center">Số lượng SKU</th>
              <th class="p-4 text-center">Tổng lệch (Qty)</th>
              <th class="p-4 text-right">Giá trị chênh lệch</th>
              <th class="p-4">Trạng thái</th>
              <th class="p-4">Ngày tạo</th>
              <th class="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading" class="text-center">
              <td colspan="8" class="p-8 text-slate-400">Đang tải danh sách kiểm kê...</td>
            </tr>
            <tr v-else-if="audits.length === 0" class="text-center">
              <td colspan="8" class="p-8 text-slate-400">Chưa có đợt kiểm kê nào.</td>
            </tr>
            <tr v-for="audit in audits" :key="audit._id" class="hover:bg-slate-50/60 transition-colors">
              <td class="p-4 font-mono font-bold text-slate-800">
                <span class="px-2 py-1 bg-slate-100 rounded-md border border-slate-200">{{ audit.auditCode }}</span>
              </td>
              <td class="p-4 font-extrabold text-slate-900">
                {{ audit.title }}
                <p v-if="audit.requiresApproval" class="text-[10px] text-amber-600 font-bold">⚠️ Vượt ngưỡng kiểm soát (Cần duyệt)</p>
              </td>
              <td class="p-4 text-center font-bold text-slate-700">
                {{ audit.items?.length || 0 }} SKU
              </td>
              <td class="p-4 text-center font-mono font-bold" :class="[audit.totalDiscrepancyQty > 0 ? 'text-red-600' : 'text-slate-700']">
                {{ audit.totalDiscrepancyQty || 0 }}
              </td>
              <td
                class="p-4 text-right font-black"
                :class="[
                  (audit.totalDiscrepancyValue || 0) < 0
                    ? 'text-red-600'
                    : (audit.totalDiscrepancyValue || 0) > 0
                    ? 'text-emerald-700'
                    : 'text-slate-600'
                ]"
              >
                {{ formatCurrency(audit.totalDiscrepancyValue || 0) }}
              </td>
              <td class="p-4">
                <span
                  class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border"
                  :class="getAuditStatusClass(audit.status)"
                >
                  {{ getAuditStatusLabel(audit.status) }}
                </span>
              </td>
              <td class="p-4 text-slate-500">
                {{ formatDate(audit.createdAt) }}
              </td>
              <td class="p-4 text-right space-x-1.5 whitespace-nowrap">
                <!-- Nút đếm số thực tế (DRAFT) -->
                <button
                  v-if="audit.status === 'DRAFT' || audit.status === 'PENDING_APPROVAL'"
                  class="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg border border-blue-200 cursor-pointer"
                  @click="openCountModal(audit)"
                >
                  Kiểm đếm
                </button>

                <!-- Nút Quản lý Phê duyệt (PENDING_APPROVAL) -->
                <button
                  v-if="audit.status === 'PENDING_APPROVAL'"
                  class="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-lg shadow-xs cursor-pointer"
                  @click="handleApproveAudit(audit)"
                >
                  Duyệt kho
                </button>

                <!-- Nút Từ chối -->
                <button
                  v-if="audit.status === 'PENDING_APPROVAL'"
                  class="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg border border-red-200 cursor-pointer"
                  @click="handleRejectAudit(audit)"
                >
                  Từ chối
                </button>

                <!-- Nút Xem chi tiết kết quả -->
                <button
                  v-if="audit.status === 'APPROVED' || audit.status === 'REJECTED'"
                  class="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  @click="openCountModal(audit)"
                >
                  👁️ Xem
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL TẠO ĐỢT KIỂM KÊ -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
        <h3 class="text-base font-extrabold text-slate-900">Tạo đợt kiểm kê kho</h3>
        <p class="text-xs text-slate-500 font-medium">Hệ thống sẽ đóng băng số lượng tồn kho (systemStock) hiện tại của toàn bộ sản phẩm để làm mốc đối soát.</p>

        <form class="space-y-3" @submit.prevent="submitCreate">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Tiêu đề đợt kiểm kê *</label>
            <input
              v-model="createFormData.title"
              type="text"
              required
              placeholder="VD: Kiểm kê định kỳ Cuối Tháng 10/2026"
              class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Ghi chú đợt kiểm</label>
            <input
              v-model="createFormData.note"
              type="text"
              placeholder="Ghi chú thêm về nhân sự, ca kiểm..."
              class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              class="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              @click="showCreateModal = false"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="submittingCreate"
              class="px-4 py-2 text-xs font-bold text-white bg-[#dc2626] hover:bg-red-700 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {{ submittingCreate ? 'Đang tạo...' : 'Tạo đợt kiểm' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL KIỂM ĐẾM & NHẬP SỐ THỰC TẾ -->
    <div v-if="showCountModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="border-b border-slate-100 pb-3 flex justify-between items-center">
          <div>
            <h3 class="text-base font-extrabold text-slate-900">{{ activeAudit?.title }} ({{ activeAudit?.auditCode }})</h3>
            <p class="text-xs text-slate-500 font-medium">Nhập số lượng thực đếm tại quầy và kho. Hệ thống tự động tính chênh lệch.</p>
          </div>
          <button class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" @click="showCountModal = false">✕</button>
        </div>

        <!-- Alert Ngưỡng kiểm soát -->
        <div class="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800">
          <span>⚠️</span>
          <span><strong>Chính sách kiểm duyệt ERP-04:</strong> Nếu lệch trên 5 đơn vị hoặc giá trị chênh lệch trên 500.000 đ, kết quả kiểm kê bắt buộc phải có Quản lý phê duyệt trước khi kho được cập nhật.</span>
        </div>

        <form class="space-y-4" @submit.prevent="submitCount">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th class="p-2.5">Sản phẩm</th>
                  <th class="p-2.5 text-center">ĐVT</th>
                  <th class="p-2.5 text-center">Tồn hệ thống</th>
                  <th class="p-2.5 text-center w-28">Thực đếm</th>
                  <th class="p-2.5 text-center">Chênh lệch</th>
                  <th class="p-2.5 text-right">Giá trị lệch</th>
                  <th class="p-2.5">Lý do</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="item in activeAudit?.items" :key="item.product?._id || item.product" class="hover:bg-slate-50/60">
                  <td class="p-2.5">
                    <p class="font-bold text-slate-900">{{ item.productName }}</p>
                    <p class="text-[10px] text-slate-400 font-mono">{{ item.sku }}</p>
                  </td>
                  <td class="p-2.5 text-center font-mono">{{ item.unit }}</td>
                  <td class="p-2.5 text-center font-bold text-slate-700 bg-slate-50/80">{{ item.systemStock }}</td>
                  <td class="p-2.5 text-center">
                    <input
                      v-if="activeAudit.status === 'DRAFT' || activeAudit.status === 'PENDING_APPROVAL'"
                      v-model.number="item.actualStock"
                      type="number"
                      min="0"
                      required
                      class="w-20 text-xs border border-slate-200 rounded-xl px-2 py-1.5 bg-white text-center font-bold"
                      @input="onActualStockInput(item)"
                    />
                    <span v-else class="font-black text-slate-800">{{ item.actualStock }}</span>
                  </td>
                  <td class="p-2.5 text-center font-mono font-black">
                    <span
                      class="px-2 py-0.5 rounded-md"
                      :class="[
                        (item.actualStock - item.systemStock) < 0
                          ? 'bg-red-50 text-red-600'
                          : (item.actualStock - item.systemStock) > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-400'
                      ]"
                    >
                      {{ (item.actualStock - item.systemStock) > 0 ? '+' : '' }}{{ item.actualStock - item.systemStock }}
                    </span>
                  </td>
                  <td class="p-2.5 text-right font-black" :class="[(item.actualStock - item.systemStock) < 0 ? 'text-red-600' : 'text-slate-800']">
                    {{ formatCurrency((item.actualStock - item.systemStock) * (item.costPrice || 0)) }}
                  </td>
                  <td class="p-2.5">
                    <input
                      v-if="activeAudit.status === 'DRAFT' || activeAudit.status === 'PENDING_APPROVAL'"
                      v-model="item.reason"
                      type="text"
                      placeholder="Lý do chênh lệch"
                      class="w-full text-xs border border-slate-200 rounded-xl px-2 py-1 focus:outline-none focus:border-red-500"
                    />
                    <span v-else class="text-slate-600">{{ item.reason || '—' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              class="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              @click="showCountModal = false"
            >
              Đóng
            </button>
            <button
              v-if="activeAudit.status === 'DRAFT' || activeAudit.status === 'PENDING_APPROVAL'"
              type="submit"
              :disabled="submittingCount"
              class="px-4 py-2 text-xs font-bold text-white bg-[#dc2626] hover:bg-red-700 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {{ submittingCount ? 'Đang lưu...' : 'Lưu kết quả & Gửi phê duyệt' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { stockAuditService } from '@/services/stock-audit.service'
import { useToast } from 'vue-toastification'

const toast = useToast()

const audits = ref<any[]>([])
const loading = ref(false)

const showCreateModal = ref(false)
const submittingCreate = ref(false)
const createFormData = ref({
  title: '',
  note: '',
})

const showCountModal = ref(false)
const activeAudit = ref<any>(null)
const submittingCount = ref(false)

async function fetchAudits() {
  loading.value = true
  try {
    const res: any = await stockAuditService.getAll()
    const body = res?.data || res
    audits.value = body?.data || []
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Không thể tải danh sách kiểm kê')
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  createFormData.value = {
    title: `Kiểm kê kho ngày ${new Date().toLocaleDateString('vi-VN')}`,
    note: '',
  }
  showCreateModal.value = true
}

async function submitCreate() {
  submittingCreate.value = true
  try {
    await stockAuditService.create(createFormData.value)
    toast.success('Đã tạo đợt kiểm kê thành công!')
    showCreateModal.value = false
    fetchAudits()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi khi tạo đợt kiểm kê')
  } finally {
    submittingCreate.value = false
  }
}

function openCountModal(audit: any) {
  activeAudit.value = JSON.parse(JSON.stringify(audit))
  showCountModal.value = true
}

function onActualStockInput(item: any) {
  item.discrepancy = item.actualStock - item.systemStock
}

async function submitCount() {
  submittingCount.value = true
  try {
    const payload = {
      items: activeAudit.value.items.map((it: any) => ({
        product: it.product?._id || it.product,
        actualStock: it.actualStock,
        reason: it.reason || '',
      })),
      note: activeAudit.value.note,
    }
    await stockAuditService.submitCount(activeAudit.value._id, payload)
    toast.success('Đã lưu kết quả kiểm đếm và gửi phê duyệt!')
    showCountModal.value = false
    fetchAudits()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi khi lưu kết quả kiểm kê')
  } finally {
    submittingCount.value = false
  }
}

async function handleApproveAudit(audit: any) {
  if (
    !confirm(
      `Xác nhận phê duyệt đợt kiểm kê "${audit.auditCode}"?\n\nKho sẽ được tự động điều chỉnh theo số thực đếm. Nếu có xung đột dữ liệu bán hàng phát sinh, hệ thống sẽ cảnh báo 409 Conflict.`,
    )
  ) {
    return
  }

  try {
    await stockAuditService.approve(audit._id, { note: 'Quản lý duyệt chênh lệch kho' })
    toast.success('Đã duyệt đợt kiểm kê và tự động cân bằng tồn kho!')
    fetchAudits()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Không thể phê duyệt kiểm kê')
  }
}

async function handleRejectAudit(audit: any) {
  const reason = prompt('Nhập lý do từ chối kết quả kiểm kê:')
  if (!reason) return
  try {
    await stockAuditService.reject(audit._id, reason)
    toast.success('Đã từ chối đợt kiểm kê!')
    fetchAudits()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Không thể từ chối kiểm kê')
  }
}

function getAuditStatusClass(status: string) {
  switch (status) {
    case 'DRAFT': return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'PENDING_APPROVAL': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'REJECTED': return 'bg-red-50 text-red-700 border-red-200'
    default: return 'bg-slate-100 text-slate-600'
  }
}

function getAuditStatusLabel(status: string) {
  switch (status) {
    case 'DRAFT': return 'Đang đếm (DRAFT)'
    case 'PENDING_APPROVAL': return 'Chờ duyệt'
    case 'APPROVED': return 'Đã duyệt (Đã cân kho)'
    case 'REJECTED': return 'Đã từ chối'
    default: return status
  }
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
  fetchAudits()
})
</script>
