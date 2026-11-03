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

        <button
          v-if="activeTab === 'cod'"
          class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
          @click="openCreateCodModal"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Lập Bảng Kê Đối Soát COD
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

        <button
          :class="activeTab === 'receivables' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 font-medium'"
          class="py-3 px-1 border-b-2 text-sm transition-colors flex items-center gap-2"
          @click="activeTab = 'receivables'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Công Nợ Khách Sỉ (AR)
          <span class="ml-1 px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
            {{ receivablesTotal }}
          </span>
        </button>

        <button
          :class="activeTab === 'cod' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 font-medium'"
          class="py-3 px-1 border-b-2 text-sm transition-colors flex items-center gap-2"
          @click="activeTab = 'cod'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Đối Soát COD Logistics
          <span class="ml-1 px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
            {{ pendingCodOrders.length }}
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

          <input
            v-model="entriesFilter.startDate"
            type="date"
            class="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs"
            title="Từ ngày"
            @change="fetchEntries"
          />

          <input
            v-model="entriesFilter.endDate"
            type="date"
            class="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs"
            title="Đến ngày"
            @change="fetchEntries"
          />
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

    <!-- TAB 4: CUSTOMER RECEIVABLES (AR-01) -->
    <div v-if="activeTab === 'receivables'" class="space-y-6">
      <!-- Aging Report KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tổng Phải Thu Khách Sỉ</p>
          <p class="text-xl font-extrabold text-blue-600 mt-1">{{ formatCurrency(agingData?.totalOutstanding || 0) }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Trong Hạn (Current)</p>
          <p class="text-xl font-extrabold text-emerald-600 mt-1">{{ formatCurrency(agingData?.current || 0) }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Quá Hạn 1 - 30 Ngày</p>
          <p class="text-xl font-extrabold text-amber-600 mt-1">{{ formatCurrency(agingData?.days1_30 || 0) }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Quá Hạn > 30 Ngày (Cảnh Báo)</p>
          <p class="text-xl font-extrabold text-rose-600 mt-1">{{ formatCurrency((agingData?.days31_60 || 0) + (agingData?.days60Plus || 0)) }}</p>
        </div>
      </div>

      <!-- Receivables Table -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Danh Sách Phiếu Phải Thu Khách Sỉ</h3>
          <button class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer" @click="fetchReceivables">
            Làm mới
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 uppercase">
              <tr>
                <th class="py-3 px-4">Khách hàng</th>
                <th class="py-3 px-4">Đơn hàng liên quan</th>
                <th class="py-3 px-4 text-right">Tổng phải thu</th>
                <th class="py-3 px-4 text-right">Đã thu</th>
                <th class="py-3 px-4 text-right">Còn nợ</th>
                <th class="py-3 px-4 text-center">Hạn trả</th>
                <th class="py-3 px-4 text-center">Trạng thái</th>
                <th class="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="loadingReceivables" class="text-center">
                <td colspan="8" class="py-8 text-gray-400">Đang tải danh sách công nợ khách sỉ...</td>
              </tr>
              <tr v-else-if="receivables.length === 0" class="text-center">
                <td colspan="8" class="py-8 text-gray-400">Không có công nợ khách sỉ nào cần thu.</td>
              </tr>
              <tr v-for="r in receivables" :key="r._id" class="hover:bg-gray-50/50">
                <td class="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  {{ r.customer?.fullName || r.customer?.name || 'Khách buôn' }}
                  <span v-if="r.customer?.phone" class="block text-xs font-normal text-gray-400">{{ r.customer.phone }}</span>
                </td>
                <td class="py-3 px-4 font-mono text-xs text-blue-600">
                  {{ r.order?.orderCode || r.orderCode || r.invoiceCode || '-' }}
                </td>
                <td class="py-3 px-4 text-right font-medium">
                  {{ formatCurrency(r.totalAmount) }}
                </td>
                <td class="py-3 px-4 text-right text-emerald-600 font-medium">
                  {{ formatCurrency(r.paidAmount || 0) }}
                </td>
                <td class="py-3 px-4 text-right font-extrabold text-rose-600">
                  {{ formatCurrency(r.remainingAmount) }}
                </td>
                <td class="py-3 px-4 text-center text-xs">
                  {{ formatDate(r.dueDate) }}
                </td>
                <td class="py-3 px-4 text-center">
                  <span :class="payableBadgeClass(r.status)" class="px-2 py-0.5 rounded-full text-xs font-semibold">
                    {{ payableLabel(r.status) }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <button
                    v-if="r.status !== 'PAID'"
                    class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
                    @click="openCollectModal(r)"
                  >
                    Thu tiền
                  </button>
                  <span v-else class="text-xs text-emerald-600 font-bold">Đã thu đủ</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 5: COD LOGISTICS RECONCILIATION (FIN-COD-01) -->
    <div v-if="activeTab === 'cod'" class="space-y-6">
      <!-- COD Summary KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">COD Đang Chờ Đối Soát</p>
          <p class="text-xl font-extrabold text-amber-600 mt-1">{{ formatCurrency(totalPendingCodAmount) }}</p>
          <p class="text-[11px] text-gray-400 mt-0.5">{{ pendingCodOrders.length }} đơn đã giao thành công</p>
        </div>

        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Số Lô Bảng Kê Đã Khớp</p>
          <p class="text-xl font-extrabold text-blue-600 mt-1">{{ codBatches.length }}</p>
          <p class="text-[11px] text-gray-400 mt-0.5">Lô đối soát lưu trữ</p>
        </div>

        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tổng Thực Nhận (Net Payout)</p>
          <p class="text-xl font-extrabold text-emerald-600 mt-1">{{ formatCurrency(totalReconciledNetPayout) }}</p>
          <p class="text-[11px] text-gray-400 mt-0.5">Tiền đã về sổ quỹ ngân hàng</p>
        </div>

        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Lệch Soát Cần Lưu Ý</p>
          <p class="text-xl font-extrabold text-rose-600 mt-1">{{ totalDiscrepanciesCount }}</p>
          <p class="text-[11px] text-gray-400 mt-0.5">Đơn lệch tiền hoặc đơn hoàn</p>
        </div>
      </div>

      <!-- SECTION A: DANH SÁCH ĐƠN HÀNG COD CHỜ ĐỐI SOÁT -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div class="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h3 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📦</span> Đơn Hàng COD Đang Chờ Đối Soát
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Đơn hàng giao COD thành công (DELIVERED) chưa được đối soát và cấn trừ cước phí
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="selectedPendingOrders.length > 0"
              class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              @click="populateCodModalFromSelected"
            >
              <span>+</span> Lập bảng kê từ {{ selectedPendingOrders.length }} đơn đã chọn
            </button>
            <button
              class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium cursor-pointer"
              @click="fetchPendingCodOrders"
            >
              Làm mới
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase text-[11px] font-bold border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th class="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    :checked="isAllPendingSelected"
                    class="rounded text-indigo-600 focus:ring-indigo-500"
                    @change="toggleSelectAllPending"
                  />
                </th>
                <th class="py-3 px-4">Mã Đơn Hàng</th>
                <th class="py-3 px-4">Mã Vận Đơn</th>
                <th class="py-3 px-4">Khách Hàng</th>
                <th class="py-3 px-4 text-right">Tiền Thu Hộ (COD)</th>
                <th class="py-3 px-4 text-center">Trạng Thái Vận Chuyển</th>
                <th class="py-3 px-4 text-center">Ngày Giao Hàng</th>
                <th class="py-3 px-4 text-center">Trạng Thái COD</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              <tr v-if="loadingCod" class="text-center py-8">
                <td colspan="8" class="py-8 text-gray-400">Đang tải danh sách đơn COD...</td>
              </tr>
              <tr v-else-if="pendingCodOrders.length === 0" class="text-center py-8">
                <td colspan="8" class="py-8 text-gray-400">
                  🎉 Tuyệt vời! Hiện không có đơn hàng COD nào tồn đọng chờ đối soát.
                </td>
              </tr>
              <tr
                v-for="order in pendingCodOrders"
                v-else
                :key="order._id"
                class="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td class="py-3 px-4 text-center">
                  <input
                    v-model="selectedPendingOrders"
                    type="checkbox"
                    :value="order._id"
                    class="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </td>
                <td class="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">
                  #{{ order.orderCode }}
                </td>
                <td class="py-3 px-4">
                  <span v-if="order.trackingCode" class="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {{ order.trackingCode }}
                  </span>
                  <span v-else class="text-xs text-gray-400 italic">Chưa có mã</span>
                </td>
                <td class="py-3 px-4">
                  <p class="font-medium text-gray-900 dark:text-white">{{ order.customerName || 'Khách vãng lai' }}</p>
                  <p class="text-xs text-gray-400">{{ order.phone || '-' }}</p>
                </td>
                <td class="py-3 px-4 text-right font-extrabold text-amber-600 dark:text-amber-400">
                  {{ formatCurrency(order.total) }}
                </td>
                <td class="py-3 px-4 text-center">
                  <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {{ order.shippingStatus || 'Đã giao' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-center text-xs text-gray-500">
                  {{ formatDate(order.deliveredAt || '') }}
                </td>
                <td class="py-3 px-4 text-center">
                  <span
                    :class="order.codStatus === 'DISCREPANCY' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'"
                    class="px-2 py-0.5 rounded-full text-xs font-semibold border"
                  >
                    {{ order.codStatus === 'DISCREPANCY' ? 'Lệch soát' : 'Chờ đối soát' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SECTION B: LỊCH SỬ CÁC PHIÊN ĐỐI SOÁT COD (BATCHES) -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div class="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h3 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📑</span> Lịch Sử Bảng Kê Đối Soát Hãng Vận Chuyển
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Danh sách các lô đối soát đã thực hiện ghi nhận vào sổ quỹ và ngân hàng
            </p>
          </div>
          <button
            class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium cursor-pointer"
            @click="fetchCodBatches"
          >
            Làm mới
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase text-[11px] font-bold border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th class="py-3 px-4">Mã Bảng Kê (Statement ID)</th>
                <th class="py-3 px-4">Nhà Vận Chuyển</th>
                <th class="py-3 px-4 text-center">Số Đơn Khớp</th>
                <th class="py-3 px-4 text-right">Tổng Tiền COD</th>
                <th class="py-3 px-4 text-right">Tổng Cước Cấn Trừ</th>
                <th class="py-3 px-4 text-right">Thực Nhận (Net Payout)</th>
                <th class="py-3 px-4">Tài Khoản Thụ Hưởng</th>
                <th class="py-3 px-4 text-center">Lệch Soát</th>
                <th class="py-3 px-4 text-center">Ngày Đối Soát</th>
                <th class="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              <tr v-if="loadingBatches" class="text-center py-8">
                <td colspan="10" class="py-8 text-gray-400">Đang tải lịch sử bảng kê đối soát...</td>
              </tr>
              <tr v-else-if="codBatches.length === 0" class="text-center py-8">
                <td colspan="10" class="py-8 text-gray-400">Chưa có bảng kê đối soát COD nào được lập</td>
              </tr>
              <tr
                v-for="batch in codBatches"
                v-else
                :key="batch._id"
                class="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td class="py-3 px-4 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                  {{ batch.statementId }}
                </td>
                <td class="py-3 px-4 font-bold text-gray-800 dark:text-gray-200">
                  {{ batch.carrier || 'GHN' }}
                </td>
                <td class="py-3 px-4 text-center font-bold text-emerald-600">
                  {{ batch.matchedOrdersCount }} đơn
                </td>
                <td class="py-3 px-4 text-right font-medium">
                  {{ formatCurrency(batch.totalCod) }}
                </td>
                <td class="py-3 px-4 text-right font-medium text-rose-600">
                  -{{ formatCurrency(batch.totalShipping) }}
                </td>
                <td class="py-3 px-4 text-right font-black text-emerald-700 dark:text-emerald-400">
                  {{ formatCurrency(batch.netPayout) }}
                </td>
                <td class="py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-300">
                  {{ batch.bankAccount?.name || batch.bankAccount?.code || '-' }}
                </td>
                <td class="py-3 px-4 text-center">
                  <span
                    v-if="batch.discrepanciesCount > 0"
                    class="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200"
                  >
                    {{ batch.discrepanciesCount }} đơn
                  </span>
                  <span v-else class="text-xs text-emerald-600 font-bold">Khớp 100%</span>
                </td>
                <td class="py-3 px-4 text-center text-xs text-gray-500">
                  {{ formatDate(batch.createdAt) }}
                </td>
                <td class="py-3 px-4 text-right">
                  <button
                    class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-gray-700 dark:text-gray-200 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                    @click="viewBatchDetails(batch)"
                  >
                    Chi tiết
                  </button>
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

    <!-- MODAL 4: COLLECT CUSTOMER PAYMENT (THU TIỀN CÔNG NỢ KHÁCH SỈ) -->
    <div v-if="collectingReceivable" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">Thu Tiền Công Nợ Khách Sỉ</h3>
        <p class="text-xs text-gray-500 mb-4">
          Khách hàng: <strong class="text-blue-600">{{ collectingReceivable.customer?.fullName || collectingReceivable.customer?.name }}</strong>
        </p>

        <form class="space-y-4" @submit.prevent="submitCollectCustomerPayment">
          <div class="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-700 text-xs text-emerald-800 dark:text-emerald-300 flex justify-between">
            <span>Còn nợ phải thu:</span>
            <strong class="text-sm font-bold text-rose-600">{{ formatCurrency(collectingReceivable.remainingAmount) }}</strong>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Sổ quỹ nhận tiền *</label>
            <select
              v-model="collectFormData.accountId"
              required
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl"
            >
              <option value="" disabled>Chọn sổ quỹ</option>
              <option v-for="acc in accounts" :key="acc._id" :value="acc._id">
                {{ acc.name }} (Số dư hiện tại: {{ formatCurrency(acc.currentBalance) }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Số tiền thực thu (VND) *</label>
            <input
              v-model.number="collectFormData.amount"
              type="number"
              min="1000"
              :max="collectingReceivable.remainingAmount"
              required
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-emerald-600"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ghi chú thu tiền</label>
            <input
              v-model="collectFormData.note"
              type="text"
              placeholder="VD: Thu tiền công nợ đơn hàng chuyển khoản"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl"
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              @click="collectingReceivable = null"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl disabled:opacity-50 cursor-pointer"
            >
              {{ submitting ? 'Đang ghi nhận...' : 'Xác nhận thu tiền' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 5: CREATE COD RECONCILIATION STATEMENT -->
    <div v-if="showCreateCodModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <!-- Modal Header -->
        <div class="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🚚</span> Lập Bảng Kê Đối Soát COD Logistics
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Khớp mã vận đơn, cấn trừ cước vận chuyển và ghi nhận Net Payout vào tài khoản ngân hàng
            </p>
          </div>
          <button
            class="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 cursor-pointer"
            @click="showCreateCodModal = false"
          >
            ✕
          </button>
        </div>

        <!-- Form Body -->
        <form class="flex flex-col flex-1 overflow-hidden" @submit.prevent="submitCodReconciliation">
          <div class="p-6 overflow-y-auto space-y-5 flex-1">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mã Bảng Kê Hãng Vận Chuyển *
                </label>
                <input
                  v-model="codStatementForm.statementId"
                  type="text"
                  required
                  placeholder="VD: STMT-GHN-20261103"
                  class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nhà Vận Chuyển *
                </label>
                <select
                  v-model="codStatementForm.carrier"
                  class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl"
                >
                  <option value="GHN">Giao Hàng Nhanh (GHN)</option>
                  <option value="GHTK">Giao Hàng Tiết Kiệm (GHTK)</option>
                  <option value="VIETTEL_POST">Viettel Post</option>
                  <option value="OTHER">Đối tác khác</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Sổ Quỹ / Tài Khoản Ngân Hàng Nhận Tiền *
                </label>
                <select
                  v-model="codStatementForm.bankAccountId"
                  required
                  class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl font-medium"
                >
                  <option value="" disabled>-- Chọn tài khoản ngân hàng --</option>
                  <option
                    v-for="acc in accounts"
                    :key="acc._id"
                    :value="acc._id"
                  >
                    {{ acc.code }} - {{ acc.name }} ({{ formatCurrency(acc.currentBalance) }})
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ghi chú đối soát</label>
              <input
                v-model="codStatementForm.note"
                type="text"
                placeholder="VD: Đối soát kỳ thanh toán đợt 1 tháng 11/2026"
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl"
              />
            </div>

            <!-- Items Table in Statement -->
            <div class="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
              <div class="p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Chi Tiết Danh Sách Vận Đơn ({{ codStatementForm.items.length }})
                </span>
                <button
                  type="button"
                  class="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 text-indigo-600 font-bold rounded-lg text-xs cursor-pointer"
                  @click="addCodItemRow"
                >
                  + Thêm dòng vận đơn
                </button>
              </div>

              <div class="max-h-60 overflow-y-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold sticky top-0">
                    <tr>
                      <th class="py-2 px-3">#</th>
                      <th class="py-2 px-3">Mã Vận Đơn (Tracking Code) *</th>
                      <th class="py-2 px-3 text-right">Tiền Thu Hộ (VND) *</th>
                      <th class="py-2 px-3 text-right">Cước Phí VC (VND) *</th>
                      <th class="py-2 px-3 text-right">Cước Hoàn (VND)</th>
                      <th class="py-2 px-3 text-center w-12">Xóa</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                    <tr v-for="(item, idx) in codStatementForm.items" :key="idx" class="hover:bg-gray-50/50">
                      <td class="py-2 px-3 text-gray-400 font-mono">{{ idx + 1 }}</td>
                      <td class="py-2 px-3">
                        <input
                          v-model="item.trackingCode"
                          type="text"
                          required
                          placeholder="Mã tracking"
                          class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg font-mono font-bold"
                        />
                      </td>
                      <td class="py-2 px-3 text-right">
                        <input
                          v-model.number="item.codAmount"
                          type="number"
                          min="0"
                          required
                          class="w-28 px-2 py-1 text-xs text-right bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg font-bold text-amber-600"
                        />
                      </td>
                      <td class="py-2 px-3 text-right">
                        <input
                          v-model.number="item.shippingFee"
                          type="number"
                          min="0"
                          required
                          class="w-24 px-2 py-1 text-xs text-right bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-rose-600"
                        />
                      </td>
                      <td class="py-2 px-3 text-right">
                        <input
                          v-model.number="item.returnFee"
                          type="number"
                          min="0"
                          class="w-24 px-2 py-1 text-xs text-right bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600"
                        />
                      </td>
                      <td class="py-2 px-3 text-center">
                        <button
                          type="button"
                          class="text-red-500 hover:text-red-700 font-bold text-sm cursor-pointer"
                          @click="removeCodItemRow(idx)"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Calculated Summary Bar -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl">
              <div>
                <span class="text-xs text-gray-500 dark:text-gray-400">Tổng Tiền Thu Hộ (COD):</span>
                <p class="text-base font-extrabold text-amber-600">{{ formatCurrency(computedTotalCod) }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-500 dark:text-gray-400">Tổng Cước Cấn Trừ:</span>
                <p class="text-base font-extrabold text-rose-600">-{{ formatCurrency(computedTotalShipping) }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-500 dark:text-gray-400">Thực Nhận Chuyển Khoản (Net Payout):</span>
                <p class="text-lg font-black text-indigo-700 dark:text-indigo-400">{{ formatCurrency(computedNetPayout) }}</p>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
            <button
              type="button"
              class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 dark:text-gray-300 rounded-xl cursor-pointer"
              @click="showCreateCodModal = false"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="submitting || codStatementForm.items.length === 0"
              class="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {{ submitting ? 'Đang xử lý đối soát...' : 'Xác nhận đối soát & Ghi sổ quỹ' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 6: VIEW COD BATCH DETAILS -->
    <div v-if="selectedBatchDetails" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
          <h3 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📋</span> Chi Tiết Bảng Kê Đối Soát
          </h3>
          <button
            class="w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 cursor-pointer"
            @click="selectedBatchDetails = null"
          >
            ✕
          </button>
        </div>

        <div class="text-xs space-y-2 text-gray-700 dark:text-gray-300">
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
            <span class="text-gray-400">Mã Bảng Kê:</span>
            <span class="font-mono font-bold text-indigo-600">{{ selectedBatchDetails.statementId }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
            <span class="text-gray-400">Đối Tác:</span>
            <span class="font-bold">{{ selectedBatchDetails.carrier }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
            <span class="text-gray-400">Tài Khoản Thụ Hưởng:</span>
            <span class="font-bold">{{ selectedBatchDetails.bankAccount?.name || '-' }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
            <span class="text-gray-400">Số Đơn Khớp:</span>
            <span class="font-bold text-emerald-600">{{ selectedBatchDetails.matchedOrdersCount }} đơn</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
            <span class="text-gray-400">Tổng Tiền COD Thu Hộ:</span>
            <span class="font-bold text-amber-600">{{ formatCurrency(selectedBatchDetails.totalCod) }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
            <span class="text-gray-400">Cước Vận Chuyển:</span>
            <span class="font-bold text-rose-600">-{{ formatCurrency(selectedBatchDetails.totalShipping) }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
            <span class="text-gray-400 font-bold">Thực Nhận (Net Payout):</span>
            <span class="font-extrabold text-sm text-emerald-600">{{ formatCurrency(selectedBatchDetails.netPayout) }}</span>
          </div>
          <div v-if="selectedBatchDetails.note" class="py-1">
            <span class="text-gray-400">Ghi chú:</span>
            <p class="mt-0.5 italic text-gray-600 dark:text-gray-300">{{ selectedBatchDetails.note }}</p>
          </div>
        </div>

        <div v-if="selectedBatchDetails.discrepancies && selectedBatchDetails.discrepancies.length > 0" class="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2">
          <p class="text-xs font-bold text-rose-600">Danh Sách Lệch Soát ({{ selectedBatchDetails.discrepancies.length }}):</p>
          <div class="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            <div
              v-for="(disc, dIdx) in selectedBatchDetails.discrepancies"
              :key="dIdx"
              class="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-[11px] border border-rose-200/60"
            >
              <p class="font-mono font-bold text-rose-800 dark:text-rose-300">{{ disc.trackingCode }}</p>
              <p class="text-rose-600 dark:text-rose-400">{{ disc.reason }}</p>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-gray-100 dark:border-gray-700 text-right">
          <button
            class="px-4 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl cursor-pointer"
            @click="selectedBatchDetails = null"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'vue-toastification';
import {
  financeService,
  type CashAccount,
  type CashEntry,
  type SupplierPayable,
  type CodReconciliationBatch,
  type PendingCodOrder,
} from '@/services/finance.service';

const toast = useToast();

const activeTab = ref<'accounts' | 'entries' | 'payables' | 'receivables' | 'cod'>('entries');
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
  category: '',
  status: '',
  startDate: '',
  endDate: '',
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

// Receivables (AR)
const receivables = ref<any[]>([]);
const receivablesTotal = ref(0);
const loadingReceivables = ref(false);
const agingData = ref<any>(null);
const collectingReceivable = ref<any>(null);
const collectFormData = ref({
  accountId: '',
  amount: 0,
  note: '',
});

// COD Logistics (FIN-COD-01)
const pendingCodOrders = ref<PendingCodOrder[]>([]);
const codBatches = ref<CodReconciliationBatch[]>([]);
const loadingCod = ref(false);
const loadingBatches = ref(false);
const selectedPendingOrders = ref<string[]>([]);
const showCreateCodModal = ref(false);
const selectedBatchDetails = ref<CodReconciliationBatch | null>(null);

const codStatementForm = ref<{
  statementId: string;
  carrier: string;
  bankAccountId: string;
  note: string;
  items: Array<{ trackingCode: string; codAmount: number; shippingFee: number; returnFee: number }>;
}>({
  statementId: '',
  carrier: 'GHN',
  bankAccountId: '',
  note: '',
  items: [],
});

const totalPendingCodAmount = computed(() => {
  return pendingCodOrders.value.reduce((sum, o) => sum + (o.total || 0), 0);
});

const totalReconciledNetPayout = computed(() => {
  return codBatches.value.reduce((sum, b) => sum + (b.netPayout || 0), 0);
});

const totalDiscrepanciesCount = computed(() => {
  return codBatches.value.reduce((sum, b) => sum + (b.discrepanciesCount || 0), 0);
});

const isAllPendingSelected = computed(() => {
  return (
    pendingCodOrders.value.length > 0 &&
    selectedPendingOrders.value.length === pendingCodOrders.value.length
  );
});

const computedTotalCod = computed(() => {
  return codStatementForm.value.items.reduce((sum, it) => sum + (Number(it.codAmount) || 0), 0);
});

const computedTotalShipping = computed(() => {
  return codStatementForm.value.items.reduce(
    (sum, it) => sum + (Number(it.shippingFee) || 0) + (Number(it.returnFee) || 0),
    0,
  );
});

const computedNetPayout = computed(() => {
  return computedTotalCod.value - computedTotalShipping.value;
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
      category: entriesFilter.value.category || undefined,
      status: entriesFilter.value.status || undefined,
      startDate: entriesFilter.value.startDate || undefined,
      endDate: entriesFilter.value.endDate || undefined,
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
    const blob = await financeService.exportEntries({
      search: entriesFilter.value.search || undefined,
      direction: entriesFilter.value.direction || undefined,
      accountId: entriesFilter.value.accountId || undefined,
      category: entriesFilter.value.category || undefined,
      status: entriesFilter.value.status || undefined,
      startDate: entriesFilter.value.startDate || undefined,
      endDate: entriesFilter.value.endDate || undefined,
    });
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

async function fetchReceivables() {
  loadingReceivables.value = true;
  try {
    const [recRes, agingRes] = await Promise.all([
      financeService.getReceivables(),
      financeService.getAgingReport(),
    ]);
    receivables.value = recRes.data || [];
    receivablesTotal.value = recRes.total || 0;
    agingData.value = agingRes || null;
  } catch (_err: any) {
    // Non-blocking
  } finally {
    loadingReceivables.value = false;
  }
}

function openCollectModal(r: any) {
  collectingReceivable.value = r;
  collectFormData.value = {
    accountId: accounts.value[0]?._id || '',
    amount: r.remainingAmount,
    note: '',
  };
}

async function submitCollectCustomerPayment() {
  if (!collectingReceivable.value) return;
  submitting.value = true;
  try {
    await financeService.collectCustomerPayment(collectingReceivable.value._id, {
      accountId: collectFormData.value.accountId,
      amount: collectFormData.value.amount,
      note: collectFormData.value.note,
      idempotencyKey: `collect_${collectingReceivable.value._id}_${Date.now()}`,
    });
    toast.success('Thu tiền công nợ khách sỉ thành công');
    collectingReceivable.value = null;
    fetchAccounts();
    fetchReceivables();
    fetchEntries();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi khi thu tiền công nợ');
  } finally {
    submitting.value = false;
  }
}

function toggleSelectAllPending() {
  if (isAllPendingSelected.value) {
    selectedPendingOrders.value = [];
  } else {
    selectedPendingOrders.value = pendingCodOrders.value.map((o) => o._id);
  }
}

function openCreateCodModal() {
  showCreateCodModal.value = true;
  if (!codStatementForm.value.bankAccountId && accounts.value.length > 0) {
    const bankAcc = accounts.value.find((a) => a.type === 'BANK_ACCOUNT') || accounts.value[0];
    codStatementForm.value.bankAccountId = bankAcc._id;
  }
  if (!codStatementForm.value.statementId) {
    codStatementForm.value.statementId = `STMT-GHN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`;
  }
}

function populateCodModalFromSelected() {
  const selectedObjs = pendingCodOrders.value.filter((o) =>
    selectedPendingOrders.value.includes(o._id),
  );
  if (selectedObjs.length === 0) return;

  codStatementForm.value.items = selectedObjs.map((o) => ({
    trackingCode: o.trackingCode || o.orderCode,
    codAmount: o.total || 0,
    shippingFee: 22000,
    returnFee: 0,
  }));
  openCreateCodModal();
}

function addCodItemRow() {
  codStatementForm.value.items.push({
    trackingCode: '',
    codAmount: 0,
    shippingFee: 22000,
    returnFee: 0,
  });
}

function removeCodItemRow(index: number) {
  codStatementForm.value.items.splice(index, 1);
}

async function fetchPendingCodOrders() {
  loadingCod.value = true;
  try {
    pendingCodOrders.value = await financeService.getPendingCodOrders();
  } catch (_err) {
    // Non-blocking
  } finally {
    loadingCod.value = false;
  }
}

async function fetchCodBatches() {
  loadingBatches.value = true;
  try {
    codBatches.value = await financeService.getCodBatches();
  } catch (_err) {
    // Non-blocking
  } finally {
    loadingBatches.value = false;
  }
}

async function submitCodReconciliation() {
  if (codStatementForm.value.items.length === 0) {
    toast.error('Bảng kê phải có ít nhất 1 vận đơn');
    return;
  }
  submitting.value = true;
  try {
    const res = await financeService.reconcileCodStatement({
      statementId: codStatementForm.value.statementId.trim(),
      carrier: codStatementForm.value.carrier,
      bankAccountId: codStatementForm.value.bankAccountId,
      note: codStatementForm.value.note ? codStatementForm.value.note.trim() : undefined,
      items: codStatementForm.value.items.map((it) => ({
        trackingCode: it.trackingCode.trim(),
        codAmount: Number(it.codAmount) || 0,
        shippingFee: Number(it.shippingFee) || 0,
        returnFee: it.returnFee ? Number(it.returnFee) : undefined,
      })),
    });

    toast.success(
      `Đối soát thành công ${res.matchedOrdersCount || 0} đơn! Net Payout: ${formatCurrency(res.netPayout || 0)}`,
    );
    showCreateCodModal.value = false;
    selectedPendingOrders.value = [];
    codStatementForm.value = {
      statementId: '',
      carrier: 'GHN',
      bankAccountId: accounts.value[0]?._id || '',
      note: '',
      items: [],
    };
    fetchAccounts();
    fetchPendingCodOrders();
    fetchCodBatches();
    fetchEntries();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi khi xử lý bảng kê đối soát COD');
  } finally {
    submitting.value = false;
  }
}

function viewBatchDetails(batch: CodReconciliationBatch) {
  selectedBatchDetails.value = batch;
}

onMounted(() => {
  fetchAccounts();
  fetchEntries();
  fetchPayables();
  fetchReceivables();
  fetchPendingCodOrders();
  fetchCodBatches();
});
</script>
