<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Sổ Quỹ & Quản Lý Thu Chi</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Theo dõi số dư các sổ quỹ, lập phiếu thu / phiếu chi và quản lý công nợ nhà cung cấp (AP)
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          v-if="activeTab === 'entries'"
          class="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
          @click="exportExcel"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Xuất Excel Sổ Quỹ
        </button>

        <button
          v-if="activeTab === 'accounts'"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
          @click="showCreateAccountModal = true"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Thêm Sổ Quỹ
        </button>

        <button
          v-if="activeTab === 'entries'"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
          @click="showCreateEntryModal = true"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Lập Phiếu Thu / Chi
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="flex space-x-6">
        <button
          :class="activeTab === 'accounts' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 font-medium'"
          class="py-3 px-1 border-b-2 text-sm transition-colors flex items-center gap-2"
          @click="activeTab = 'accounts'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Danh Mục Sổ Quỹ
          <span class="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
            {{ accounts.length }}
          </span>
        </button>

        <button
          :class="activeTab === 'entries' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 font-medium'"
          class="py-3 px-1 border-b-2 text-sm transition-colors flex items-center gap-2"
          @click="activeTab = 'entries'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Sổ Quỹ Thu Chi (PT / PC)
          <span class="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {{ entriesTotal }}
          </span>
        </button>

        <button
          :class="activeTab === 'payables' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 font-medium'"
          class="py-3 px-1 border-b-2 text-sm transition-colors flex items-center gap-2"
          @click="activeTab = 'payables'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Công Nợ Nhà Cung Cấp (AP)
          <span class="ml-1 px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
            {{ payablesTotal }}
          </span>
        </button>
      </nav>
    </div>

    <!-- TAB 1: CASH ACCOUNTS -->
    <div v-if="activeTab === 'accounts'" class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="acc in accounts"
          :key="acc._id"
          class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {{ acc.code }}
            </span>
            <span
              :class="acc.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600'"
              class="px-2 py-0.5 rounded-full text-[10px] font-bold border"
            >
              {{ acc.status === 'ACTIVE' ? 'Hoạt động' : 'Khóa' }}
            </span>
          </div>

          <h3 class="text-base font-bold text-gray-900 dark:text-white mb-2">{{ acc.name }}</h3>

          <div class="space-y-1">
            <div class="text-xs text-gray-400">Số dư hiện tại:</div>
            <div class="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              {{ formatCurrency(acc.currentBalance) }}
            </div>
            <div class="text-xs text-gray-500 font-medium">
              Số dư đầu kỳ: {{ formatCurrency(acc.openingBalance) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: CASH ENTRIES -->
    <div v-if="activeTab === 'entries'" class="space-y-4">
      <!-- Filter Bar -->
      <div class="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-sm">
        <div class="flex flex-wrap items-center gap-3">
          <input
            v-model="entriesFilter.search"
            type="text"
            placeholder="Tìm theo mã phiếu, đối tác..."
            class="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs w-56"
            @input="debouncedFetchEntries"
          />

          <select
            v-model="entriesFilter.direction"
            class="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs"
            @change="fetchEntries"
          >
            <option value="">Tất cả loại (Thu / Chi)</option>
            <option value="IN">Phiếu Thu (IN)</option>
            <option value="OUT">Phiếu Chi (OUT)</option>
          </select>

          <select
            v-model="entriesFilter.accountId"
            class="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs"
            @change="fetchEntries"
          >
            <option value="">Tất cả sổ quỹ</option>
            <option v-for="acc in accounts" :key="acc._id" :value="acc._id">
              {{ acc.name }} ({{ acc.code }})
            </option>
          </select>
        </div>
      </div>

      <!-- Entries Table -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden text-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/80 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 text-xs uppercase font-semibold">
                <th class="py-3 px-4">Mã chứng từ</th>
                <th class="py-3 px-4">Ngày ghi sổ</th>
                <th class="py-3 px-4">Sổ quỹ</th>
                <th class="py-3 px-4">Loại</th>
                <th class="py-3 px-4">Danh mục</th>
                <th class="py-3 px-4 text-right">Số tiền (VND)</th>
                <th class="py-3 px-4">Đối tác / Người nộp nhận</th>
                <th class="py-3 px-4 text-center">Trạng thái</th>
                <th class="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="loadingEntries">
                <td colspan="9" class="py-8 text-center text-gray-400">Đang tải phiếu thu chi...</td>
              </tr>
              <tr v-else-if="entries.length === 0">
                <td colspan="9" class="py-12 text-center text-gray-400">Chưa có phiếu thu chi nào</td>
              </tr>
              <tr
                v-for="entry in entries"
                :key="entry._id"
                class="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td class="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">
                  {{ entry.entryCode }}
                </td>
                <td class="py-3 px-4 text-xs text-gray-500">
                  {{ formatDate(entry.postedAt) }}
                </td>
                <td class="py-3 px-4 text-xs font-medium">
                  {{ entry.account?.name || '-' }}
                </td>
                <td class="py-3 px-4">
                  <span
                    :class="entry.direction === 'IN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'"
                    class="px-2 py-0.5 rounded-full text-xs font-bold border"
                  >
                    {{ entry.direction === 'IN' ? 'THU (+)' : 'CHI (-)' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-xs text-gray-600 dark:text-gray-300">
                  {{ categoryLabel(entry.category) }}
                </td>
                <td class="py-3 px-4 text-right font-bold" :class="entry.direction === 'IN' ? 'text-emerald-600' : 'text-red-600'">
                  {{ entry.direction === 'IN' ? '+' : '-' }}{{ formatCurrency(entry.amount) }}
                </td>
                <td class="py-3 px-4 text-xs text-gray-700 dark:text-gray-300">
                  <div>{{ entry.partnerName || '-' }}</div>
                  <div v-if="entry.note" class="text-gray-400 text-[11px]">{{ entry.note }}</div>
                </td>
                <td class="py-3 px-4 text-center">
                  <span
                    :class="statusBadgeClass(entry.status)"
                    class="px-2 py-0.5 rounded-full text-xs font-semibold"
                  >
                    {{ statusLabel(entry.status) }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <button
                    v-if="entry.status === 'POSTED'"
                    class="text-xs text-amber-600 hover:text-amber-700 font-semibold underline"
                    @click="openReverseModal(entry)"
                  >
                    Hoàn đảo
                  </button>
                  <span v-else class="text-xs text-gray-400">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 3: SUPPLIER PAYABLES (CÔNG NỢ NCC) -->
    <div v-if="activeTab === 'payables'" class="space-y-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden text-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/80 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 text-xs uppercase font-semibold">
                <th class="py-3 px-4">Nhà cung cấp</th>
                <th class="py-3 px-4">Mã chứng từ GRN</th>
                <th class="py-3 px-4 text-right">Tổng tiền hàng</th>
                <th class="py-3 px-4 text-right">Đã thanh toán</th>
                <th class="py-3 px-4 text-right">Còn nợ phải trả</th>
                <th class="py-3 px-4 text-center">Hạn thanh toán</th>
                <th class="py-3 px-4 text-center">Trạng thái</th>
                <th class="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="loadingPayables">
                <td colspan="8" class="py-8 text-center text-gray-400">Đang tải công nợ NCC...</td>
              </tr>
              <tr v-else-if="payables.length === 0">
                <td colspan="8" class="py-12 text-center text-gray-400">Không có khoản công nợ nào</td>
              </tr>
              <tr
                v-for="p in payables"
                :key="p._id"
                class="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td class="py-3 px-4">
                  <div class="font-bold text-gray-900 dark:text-white">{{ p.supplier?.name }}</div>
                  <div class="text-xs text-gray-400 font-mono">{{ p.supplier?.code }}</div>
                </td>
                <td class="py-3 px-4 font-mono font-medium text-blue-600 dark:text-blue-400">
                  {{ p.invoiceCode }}
                </td>
                <td class="py-3 px-4 text-right font-medium">
                  {{ formatCurrency(p.totalAmount) }}
                </td>
                <td class="py-3 px-4 text-right text-emerald-600 font-medium">
                  {{ formatCurrency(p.paidAmount) }}
                </td>
                <td class="py-3 px-4 text-right font-extrabold text-red-600">
                  {{ formatCurrency(p.remainingAmount) }}
                </td>
                <td class="py-3 px-4 text-center text-xs">
                  {{ formatDate(p.dueDate) }}
                </td>
                <td class="py-3 px-4 text-center">
                  <span :class="payableBadgeClass(p.status)" class="px-2 py-0.5 rounded-full text-xs font-semibold">
                    {{ payableLabel(p.status) }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <button
                    v-if="p.status !== 'PAID'"
                    class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-colors"
                    @click="openPayModal(p)"
                  >
                    Chi trả
                  </button>
                  <span v-else class="text-xs text-emerald-600 font-bold">Đã tất toán</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL 1: CREATE CASH ENTRY -->
    <div v-if="showCreateEntryModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Lập Phiếu Thu / Chi</h3>
        <form class="space-y-4" @submit.prevent="submitCreateEntry">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Loại phiếu *</label>
              <select
                v-model="entryFormData.direction"
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl"
              >
                <option value="IN">Phiếu Thu (PT)</option>
                <option value="OUT">Phiếu Chi (PC)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Sổ quỹ hạch toán *</label>
              <select
                v-model="entryFormData.account"
                required
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl"
              >
                <option value="" disabled>Chọn sổ quỹ</option>
                <option v-for="acc in accounts" :key="acc._id" :value="acc._id">
                  {{ acc.name }} (Dư: {{ formatCurrency(acc.currentBalance) }})
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Danh mục *</label>
              <select
                v-model="entryFormData.category"
                required
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl"
              >
                <option value="UTILITY_EXPENSE">Chi phí điện, nước, mặt bằng</option>
                <option value="SALARY_EXPENSE">Chi lương nhân viên</option>
                <option value="SUPPLIER_PAYMENT">Chi trả nhà cung cấp</option>
                <option value="OTHER_EXPENSE">Chi phí vận hành khác</option>
                <option value="CAPITAL_INJECTION">Góp vốn / Nạp thêm quỹ</option>
                <option value="REFUND">Chi hoàn trả khách hàng</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Số tiền (VND) *</label>
              <input
                v-model.number="entryFormData.amount"
                type="number"
                min="1000"
                step="1000"
                required
                placeholder="VD: 500000"
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-blue-600"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Đối tác / Người nộp nhận</label>
            <input
              v-model="entryFormData.partnerName"
              type="text"
              placeholder="VD: Công ty Điện Lực / Anh Ba"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ghi chú chứng từ</label>
            <input
              v-model="entryFormData.note"
              type="text"
              placeholder="VD: Tiền điện cửa hàng tháng 10/2026"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl"
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
              @click="showCreateEntryModal = false"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl disabled:opacity-50"
            >
              {{ submitting ? 'Đang ghi sổ...' : 'Ghi sổ phiếu' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: PAY SUPPLIER (THANH TOÁN CÔNG NỢ) -->
    <div v-if="payingPayable" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">Thanh Toán Công Nợ NCC</h3>
        <p class="text-xs text-gray-500 mb-4">
          Chứng từ: <strong class="text-blue-600">{{ payingPayable.invoiceCode }}</strong> | NCC: {{ payingPayable.supplier?.name }}
        </p>

        <form class="space-y-4" @submit.prevent="submitPaySupplier">
          <div class="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-300 flex justify-between">
            <span>Còn nợ phải trả:</span>
            <strong class="text-sm font-bold text-red-600">{{ formatCurrency(payingPayable.remainingAmount) }}</strong>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nguồn tiền chi trả *</label>
            <select
              v-model="payFormData.accountId"
              required
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl"
            >
              <option value="" disabled>Chọn sổ quỹ</option>
              <option v-for="acc in accounts" :key="acc._id" :value="acc._id">
                {{ acc.name }} (Số dư: {{ formatCurrency(acc.currentBalance) }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Số tiền thanh toán *</label>
            <input
              v-model.number="payFormData.amount"
              type="number"
              min="1000"
              :max="payingPayable.remainingAmount"
              required
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-red-600"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
            <input
              v-model="payFormData.note"
              type="text"
              placeholder="VD: Chuyển khoản thanh toán đợt 1"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl"
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
              @click="payingPayable = null"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl disabled:opacity-50"
            >
              {{ submitting ? 'Đang chi trả...' : 'Xác nhận chi trả' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 3: REVERSAL MODAL -->
    <div v-if="reversingEntry" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Hoàn Đảo Phiếu Thu Chi</h3>
        <p class="text-xs text-gray-500 mb-4">
          Chứng từ <strong class="text-red-600">{{ reversingEntry.entryCode }}</strong> ({{ formatCurrency(reversingEntry.amount) }}) đã ghi sổ. Việc hoàn đảo sẽ tạo phiếu đối ứng để bù trừ số dư.
        </p>

        <form class="space-y-4" @submit.prevent="submitReverseEntry">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Lý do hoàn đảo *</label>
            <textarea
              v-model="reversalReason"
              required
              rows="3"
              placeholder="VD: Nhập nhầm số tiền hoặc chứng từ hủy"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
              @click="reversingEntry = null"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl disabled:opacity-50"
            >
              {{ submitting ? 'Đang hoàn đảo...' : 'Xác nhận hoàn đảo' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import {
  financeService,
  type CashAccount,
  type CashEntry,
  type SupplierPayable,
} from '@/services/finance.service';

const toast = useToast();

const activeTab = ref<'accounts' | 'entries' | 'payables'>('entries');
const submitting = ref(false);

// Accounts
const accounts = ref<CashAccount[]>([]);
const showCreateAccountModal = ref(false);

// Entries
const entries = ref<CashEntry[]>([]);
const entriesTotal = ref(0);
const loadingEntries = ref(false);
const showCreateEntryModal = ref(false);
const reversingEntry = ref<CashEntry | null>(null);
const reversalReason = ref('');

const entriesFilter = ref({
  search: '',
  direction: '',
  accountId: '',
});

const entryFormData = ref({
  account: '',
  direction: 'OUT' as const,
  category: 'UTILITY_EXPENSE',
  amount: 0,
  partnerName: '',
  note: '',
});

// Payables
const payables = ref<SupplierPayable[]>([]);
const payablesTotal = ref(0);
const loadingPayables = ref(false);
const payingPayable = ref<SupplierPayable | null>(null);
const payFormData = ref({
  accountId: '',
  amount: 0,
  note: '',
});

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('vi-VN');
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    UTILITY_EXPENSE: 'Điện nước & văn phòng',
    SALARY_EXPENSE: 'Lương nhân viên',
    SUPPLIER_PAYMENT: 'Chi trả nợ NCC',
    OTHER_EXPENSE: 'Chi phí khác',
    CAPITAL_INJECTION: 'Nạp quỹ / Góp vốn',
    REFUND: 'Hoàn trả khách hàng',
    POS_REVENUE: 'Doanh thu POS',
    ONLINE_REVENUE: 'Doanh thu Online',
  };
  return map[cat] || cat;
}

function statusLabel(status: string): string {
  switch (status) {
    case 'POSTED': return 'Đã ghi sổ';
    case 'REVERSED': return 'Đã hoàn đảo';
    case 'DRAFT': return 'Nháp';
    default: return status;
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'POSTED': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200';
    case 'REVERSED': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 line-through';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function payableLabel(status: string): string {
  switch (status) {
    case 'UNPAID': return 'Chưa thanh toán';
    case 'PARTIALLY_PAID': return 'Thanh toán một phần';
    case 'PAID': return 'Đã thanh toán đủ';
    default: return status;
  }
}

function payableBadgeClass(status: string): string {
  switch (status) {
    case 'UNPAID': return 'bg-red-50 text-red-700 border border-red-200';
    case 'PARTIALLY_PAID': return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'PAID': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    default: return 'bg-gray-100 text-gray-700';
  }
}

async function fetchAccounts() {
  try {
    accounts.value = await financeService.getAccounts();
    if (accounts.value.length > 0 && !entryFormData.value.account) {
      entryFormData.value.account = accounts.value[0]._id;
    }
  } catch (_err: any) {
    toast.error('Không thể tải danh mục sổ quỹ');
  }
}

async function fetchEntries() {
  loadingEntries.value = true;
  try {
    const res = await financeService.getEntries({
      search: entriesFilter.value.search || undefined,
      direction: entriesFilter.value.direction || undefined,
      accountId: entriesFilter.value.accountId || undefined,
    });
    entries.value = res.data || [];
    entriesTotal.value = res.total || 0;
  } catch (_err: any) {
    toast.error('Không thể tải phiếu thu chi');
  } finally {
    loadingEntries.value = false;
  }
}

let debounceTimer: any = null;
function debouncedFetchEntries() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchEntries, 300);
}

async function fetchPayables() {
  loadingPayables.value = true;
  try {
    const res = await financeService.getPayables();
    payables.value = res.data || [];
    payablesTotal.value = res.total || 0;
  } catch (_err: any) {
    toast.error('Không thể tải công nợ nhà cung cấp');
  } finally {
    loadingPayables.value = false;
  }
}

async function submitCreateEntry() {
  submitting.value = true;
  try {
    await financeService.createEntry({
      ...entryFormData.value,
      idempotencyKey: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    });
    toast.success('Ghi sổ phiếu thu chi thành công');
    showCreateEntryModal.value = false;
    entryFormData.value = {
      account: accounts.value[0]?._id || '',
      direction: 'OUT',
      category: 'UTILITY_EXPENSE',
      amount: 0,
      partnerName: '',
      note: '',
    };
    fetchAccounts();
    fetchEntries();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi khi ghi sổ phiếu thu chi');
  } finally {
    submitting.value = false;
  }
}

function openReverseModal(entry: CashEntry) {
  reversingEntry.value = entry;
  reversalReason.value = '';
}

async function submitReverseEntry() {
  if (!reversingEntry.value) return;
  submitting.value = true;
  try {
    await financeService.reverseEntry(reversingEntry.value._id, reversalReason.value);
    toast.success('Hoàn đảo phiếu thành công');
    reversingEntry.value = null;
    fetchAccounts();
    fetchEntries();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Không thể hoàn đảo phiếu');
  } finally {
    submitting.value = false;
  }
}

function openPayModal(p: SupplierPayable) {
  payingPayable.value = p;
  payFormData.value = {
    accountId: accounts.value[0]?._id || '',
    amount: p.remainingAmount,
    note: '',
  };
}

async function submitPaySupplier() {
  if (!payingPayable.value) return;
  submitting.value = true;
  try {
    await financeService.paySupplier(payingPayable.value._id, {
      accountId: payFormData.value.accountId,
      amount: payFormData.value.amount,
      note: payFormData.value.note,
      idempotencyKey: `pay_${payingPayable.value._id}_${Date.now()}`,
    });
    toast.success('Thanh toán công nợ NCC thành công');
    payingPayable.value = null;
    fetchAccounts();
    fetchPayables();
    fetchEntries();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi khi thanh toán công nợ');
  } finally {
    submitting.value = false;
  }
}

async function exportExcel() {
  try {
    const blob = await financeService.exportEntries();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `so-quy-thu-chi-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success('Xuất file Excel thành công');
  } catch (_err: any) {
    toast.error('Không thể xuất file Excel');
  }
}

onMounted(() => {
  fetchAccounts();
  fetchEntries();
  fetchPayables();
});
</script>
