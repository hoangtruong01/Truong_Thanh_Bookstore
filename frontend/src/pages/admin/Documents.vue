<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span>📁</span>
          <span>Trung Tâm Chứng Từ Điện Tử (Document Center)</span>
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Lưu trữ tập trung, đóng băng ghi sổ và bảo mật chứng từ kế toán, kho và mua bán hàng (DOC-02)
        </p>
      </div>

      <button
        class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
        @click="openCreateModal"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Tạo Chứng Từ Mới
      </button>
    </div>

    <!-- Filters Bar -->
    <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
      <div class="flex-1 min-w-[200px]">
        <input
          v-model="filters.search"
          type="text"
          placeholder="Tìm theo mã chứng từ, tên đối tác..."
          class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          @input="debouncedFetch"
        />
      </div>

      <div>
        <select
          v-model="filters.documentType"
          class="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          @change="fetchDocuments"
        >
          <option value="">Tất cả loại chứng từ</option>
          <option value="PURCHASE_ORDER">Đơn Mua Hàng (PO)</option>
          <option value="GOODS_RECEIPT">Phiếu Nhập Kho (GRN)</option>
          <option value="PURCHASE_RETURN">Phiếu Trả Hàng NCC</option>
          <option value="SALES_ORDER">Hóa Đơn Bán Hàng</option>
          <option value="CASH_RECEIPT">Phiếu Thu Tiền</option>
          <option value="CASH_PAYMENT">Phiếu Chi Tiền</option>
          <option value="STOCK_TRANSFER">Phiếu Chuyển Kho</option>
          <option value="INVOICE">Hóa Đơn VAT / Điện Tử</option>
        </select>
      </div>

      <div>
        <select
          v-model="filters.status"
          class="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          @change="fetchDocuments"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp (DRAFT)</option>
          <option value="POSTED">Đã ghi sổ (POSTED)</option>
          <option value="REVERSED">Đã hoàn đảo (REVERSED)</option>
          <option value="CANCELLED">Đã hủy (CANCELLED)</option>
        </select>
      </div>
    </div>

    <!-- Documents Table -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      <div v-if="loading" class="p-8">
        <SkeletonLoader :count="5" />
      </div>

      <div v-else-if="documents.length === 0">
        <EmptyState
          title="Không tìm thấy chứng từ"
          description="Chưa có chứng từ nào phù hợp với bộ lọc tìm kiếm hiện tại."
        />
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
              <th class="py-3 px-4">Mã Chứng Từ</th>
              <th class="py-3 px-4">Tiêu Đề</th>
              <th class="py-3 px-4">Loại Chứng Từ</th>
              <th class="py-3 px-4">Đối Tác</th>
              <th class="py-3 px-4 text-right">Giá Trị</th>
              <th class="py-3 px-4 text-center">Tệp Đính Kèm</th>
              <th class="py-3 px-4">Trạng Thái</th>
              <th class="py-3 px-4">Ngày Lập</th>
              <th class="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="doc in documents"
              :key="doc._id"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {{ doc.documentNumber || doc._id.substring(0, 8) }}
              </td>
              <td class="py-3 px-4 font-medium text-slate-900 dark:text-white">
                {{ doc.title }}
              </td>
              <td class="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                {{ formatDocType(doc.documentType) }}
              </td>
              <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                {{ doc.entityName || '-' }}
              </td>
              <td class="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                {{ doc.amount ? formatCurrency(doc.amount) : '-' }}
              </td>
              <td class="py-3 px-4 text-center">
                <button
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors"
                  :class="doc.attachments && doc.attachments.length > 0 ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'"
                  @click="openAttachmentsModal(doc)"
                >
                  <span>📎</span>
                  <span>{{ doc.attachments?.length || 0 }} files</span>
                </button>
              </td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase" :class="getStatusBadgeClass(doc.status)">
                  {{ formatStatus(doc.status) }}
                </span>
              </td>
              <td class="py-3 px-4 text-slate-400 font-mono text-[11px]">
                {{ formatDate(doc.createdAt) }}
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    v-if="doc.status === 'DRAFT'"
                    class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded-md text-[11px] transition-colors cursor-pointer"
                    title="Ghi sổ chính thức - Đóng băng không sửa đổi"
                    @click="postDocument(doc)"
                  >
                    Ghi Sổ
                  </button>
                  <button
                    v-if="doc.status === 'POSTED'"
                    class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold rounded-md text-[11px] transition-colors cursor-pointer"
                    title="Hoàn đảo chứng từ và tạo chứng từ đối ứng"
                    @click="reverseDocument(doc)"
                  >
                    Hoàn Đảo
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL 1: Tạo chứng từ mới -->
    <FormModal
      v-model="showCreateModal"
      title="Khởi Tạo Chứng Từ Mới (DRAFT)"
      @submit="submitCreateDocument"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Tiêu Đề Chứng Từ <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="createForm.title"
            type="text"
            required
            placeholder="VD: Hóa đơn GTGT mua sách NXB Trẻ"
            class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Loại Chứng Từ <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="createForm.documentType"
            required
            class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="PURCHASE_ORDER">Đơn Đặt Mua Hàng (PO)</option>
            <option value="GOODS_RECEIPT">Phiếu Nhận Hàng Vào Kho (GRN)</option>
            <option value="PURCHASE_RETURN">Phiếu Trả Hàng Nhà Cung Cấp</option>
            <option value="SALES_ORDER">Hóa Đơn / Phiếu Bán Hàng</option>
            <option value="CASH_RECEIPT">Phiếu Thu Tiền (PT)</option>
            <option value="CASH_PAYMENT">Phiếu Chi Tiền (PC)</option>
            <option value="STOCK_TRANSFER">Phiếu Điều Chuyển Kho</option>
            <option value="INVOICE">Hóa Đơn GTGT / Điện Tử</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tên Đối Tác / Khách Hàng / NCC</label>
          <input
            v-model="createForm.entityName"
            type="text"
            placeholder="VD: NXB Kim Đồng, Công ty CP Sách..."
            class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tổng Giá Trị (VNĐ)</label>
          <input
            v-model.number="createForm.amount"
            type="number"
            min="0"
            placeholder="0"
            class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mã Chứng Từ Gốc Liên Kết (Nếu có)</label>
          <input
            v-model="createForm.linkedDocumentNumber"
            type="text"
            placeholder="VD: PO-202611-0005"
            class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono"
          />
        </div>
      </div>
    </FormModal>

    <!-- MODAL 2: Quản lý File đính kèm -->
    <div
      v-if="showAttachmentsModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
    >
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 class="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>📎</span>
            <span>Tệp Đính Kèm: {{ selectedDoc?.documentNumber || selectedDoc?.title }}</span>
          </h3>
          <button
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
            @click="showAttachmentsModal = false"
          >
            ✕
          </button>
        </div>

        <div v-if="!selectedDoc?.attachments || selectedDoc.attachments.length === 0" class="p-6 text-center text-xs text-slate-400">
          Chưa có file đính kèm nào.
        </div>
        <div v-else class="space-y-2 max-h-60 overflow-y-auto">
          <div
            v-for="att in selectedDoc.attachments"
            :key="att.fileId"
            class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
          >
            <div class="flex items-center gap-2 truncate">
              <span>📄</span>
              <span class="font-medium text-slate-800 dark:text-slate-200 truncate">{{ att.fileName }}</span>
            </div>
            <a
              :href="att.fileUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold rounded-lg text-[11px] transition-colors"
            >
              Mở file
            </a>
          </div>
        </div>

        <!-- Add link attachment -->
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <span class="text-xs font-bold text-slate-700 dark:text-slate-300 block">Thêm file / liên kết an toàn (HTTPS only):</span>
          <div class="flex flex-col sm:flex-row gap-2">
            <input
              v-model="newAttachment.fileName"
              type="text"
              placeholder="Tên file (VD: Hoa_don_VAT.pdf)"
              class="flex-1 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <input
              v-model="newAttachment.fileUrl"
              type="url"
              placeholder="https://storage.../file.pdf"
              class="flex-1 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <button
              class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              @click="addAttachmentToDoc"
            >
              Thêm
            </button>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            @click="showAttachmentsModal = false"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import documentService, {
  type ERPDocument,
  type CreateERPDocumentPayload,
  type AddAttachmentPayload,
  type DocumentType,
  type DocumentStatus,
} from '@/services/document.service'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import EmptyState from '@/components/EmptyState.vue'
import FormModal from '@/components/FormModal.vue'
import { useToast } from 'vue-toastification'

const toast = useToast()

const loading = ref(false)
const documents = ref<ERPDocument[]>([])

const filters = reactive({
  search: '',
  documentType: '' as DocumentType | '',
  status: '' as DocumentStatus | '',
})

const showCreateModal = ref(false)
const showAttachmentsModal = ref(false)
const selectedDoc = ref<ERPDocument | null>(null)

const createForm = ref<CreateERPDocumentPayload>({
  title: '',
  documentType: 'PURCHASE_ORDER',
  entityName: '',
  amount: 0,
  linkedDocumentNumber: '',
})

const newAttachment = ref<AddAttachmentPayload>({
  fileName: '',
  fileUrl: '',
  fileSize: 1024,
  mimeType: 'application/pdf',
})

let debounceTimer: ReturnType<typeof setTimeout> | null = null
function debouncedFetch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchDocuments()
  }, 350)
}

async function fetchDocuments() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { limit: 50 }
    if (filters.search) params.search = filters.search
    if (filters.documentType) params.documentType = filters.documentType
    if (filters.status) params.status = filters.status

    const res = await documentService.getAll(params)
    documents.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (err: any) {
    toast.error('Lỗi tải danh sách chứng từ: ' + (err.response?.data?.message || err.message))
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  createForm.value = {
    title: '',
    documentType: 'PURCHASE_ORDER',
    entityName: '',
    amount: 0,
    linkedDocumentNumber: '',
  }
  showCreateModal.value = true
}

async function submitCreateDocument() {
  if (!createForm.value.title.trim()) {
    toast.error('Vui lòng nhập tiêu đề chứng từ!')
    return
  }
  try {
    await documentService.create(createForm.value)
    toast.success('Khởi tạo chứng từ điện tử mới thành công!')
    showCreateModal.value = false
    await fetchDocuments()
  } catch (err: any) {
    toast.error('Lỗi tạo chứng từ: ' + (err.response?.data?.message || err.message))
  }
}

async function postDocument(doc: ERPDocument) {
  const code = doc.documentNumber || doc.title
  if (!confirm(`Xác nhận ghi sổ chứng từ ${code}? Sau khi ghi sổ, chứng từ sẽ bị đóng băng.`)) return
  try {
    await documentService.post(doc._id)
    toast.success(`Chứng từ ${code} đã được ghi sổ chính thức (POSTED)`)
    await fetchDocuments()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Lỗi ghi sổ chứng từ')
  }
}

async function reverseDocument(doc: ERPDocument) {
  const code = doc.documentNumber || doc.title
  const reason = prompt(`Nhập lý do hoàn đảo chứng từ ${code}:`)
  if (!reason) return
  try {
    await documentService.reverse(doc._id, reason)
    toast.info(`Chứng từ ${code} đã được hoàn đảo an toàn (REVERSED)`)
    await fetchDocuments()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Lỗi hoàn đảo chứng từ')
  }
}

function openAttachmentsModal(doc: ERPDocument) {
  selectedDoc.value = doc
  newAttachment.value = { fileName: '', fileUrl: '', fileSize: 1024, mimeType: 'application/pdf' }
  showAttachmentsModal.value = true
}

async function addAttachmentToDoc() {
  if (!selectedDoc.value) return
  if (!newAttachment.value.fileName || !newAttachment.value.fileUrl) {
    toast.error('Vui lòng điền tên file và link URL!')
    return
  }
  if (!newAttachment.value.fileUrl.startsWith('https://')) {
    toast.error('Đường dẫn file đính kèm bắt buộc phải dùng giao thức HTTPS an toàn (https://)!')
    return
  }
  try {
    const updated = await documentService.addAttachment(selectedDoc.value._id, {
      fileName: newAttachment.value.fileName.trim(),
      fileUrl: newAttachment.value.fileUrl.trim(),
      fileSize: newAttachment.value.fileSize || 1024,
      mimeType: newAttachment.value.mimeType || 'application/pdf',
    })
    selectedDoc.value = updated
    toast.success('Đã đính kèm tệp thành công!')
    newAttachment.value = { fileName: '', fileUrl: '', fileSize: 1024, mimeType: 'application/pdf' }
    await fetchDocuments()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Lỗi đính kèm file')
  }
}

function formatDocType(type: string): string {
  const map: Record<string, string> = {
    PURCHASE_ORDER: 'Đơn Mua Hàng (PO)',
    GOODS_RECEIPT: 'Nhập Kho (GRN)',
    PURCHASE_RETURN: 'Trả Hàng NCC',
    SALES_ORDER: 'Hóa Đơn Bán Hàng',
    CASH_RECEIPT: 'Phiếu Thu (PT)',
    CASH_PAYMENT: 'Phiếu Chi (PC)',
    STOCK_TRANSFER: 'Chuyển Kho',
    INVOICE: 'Hóa Đơn VAT',
  }
  return map[type] || type
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'Bản Nháp',
    POSTED: 'Đã Ghi Sổ',
    REVERSED: 'Đã Hoàn Đảo',
    CANCELLED: 'Đã Hủy',
  }
  return map[status] || status
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'DRAFT': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    case 'POSTED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    case 'REVERSED': return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
    case 'CANCELLED': return 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

onMounted(() => {
  fetchDocuments()
})
</script>
