<template>
  <div class="space-y-6">
    <!-- View Switcher Tabs -->
    <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
      <button
        :class="activeView === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        @click="activeView = 'overview'"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Doanh Thu Đa Kênh & Lãi Gộp
      </button>

      <button
        :class="activeView === 'ledger' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        @click="switchView('ledger')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Nhập Xuất Tồn & Lãi Gộp (ERP-05)
      </button>

      <button
        :class="activeView === 'reorder' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        @click="switchView('reorder')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Đề Xuất Nhập Hàng Thông Minh (ERP-06)
      </button>
    </div>

    <!-- VIEW 1: OVERVIEW DASHBOARD -->
    <div v-if="activeView === 'overview'" class="space-y-6">
      <!-- Header -->
      <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="space-y-1">
          <h2 class="text-lg font-extrabold text-slate-900">Báo cáo & Thống kê doanh thu</h2>
          <p class="text-xs text-slate-500 font-medium">Theo dõi dữ liệu kinh doanh, tăng trưởng doanh số thực tế và cơ cấu doanh thu theo danh mục.</p>
        </div>

        <!-- Quick Range & Channel Filter -->
        <div class="flex flex-wrap items-center gap-3">
          <div class="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-200/80">
            <span class="text-xs font-bold text-slate-500">Kênh:</span>
            <select
              v-model="selectedChannel"
              class="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              @change="onChannelChange"
            >
              <option value="ALL">🌐 Tất cả các kênh</option>
              <option value="POS">🏪 Bán tại quầy (POS)</option>
              <option value="WEB">💻 Website</option>
              <option value="MOBILE">📱 Mobile App</option>
              <option value="WHOLESALE">📦 Bán sỉ</option>
            </select>
          </div>

          <div class="inline-flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              v-for="preset in rangePresets"
              :key="preset.value"
              :class="[
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all',
                selectedRange === preset.value
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              ]"
              @click="selectPreset(preset.value)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Error Alert with Retry -->
      <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between text-xs text-red-700">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>
        <button
          class="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors"
          @click="loadAllReports"
        >
          Thử lại
        </button>
      </div>

      <!-- Date Range Picker & KPI Cards Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Khoảng ngày tùy chọn</h3>
            <span v-if="selectedRange !== 'custom'" class="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">Đang lọc nhanh</span>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-[11px] font-bold text-slate-700">Từ ngày</label>
              <input
                v-model="startDate"
                type="date"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                @change="onCustomDateChange"
              />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-700">Đến ngày</label>
              <input
                v-model="endDate"
                type="date"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                @change="onCustomDateChange"
              />
            </div>
            <button
              class="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-xs uppercase tracking-wider shadow-md shadow-blue-500/20"
              @click="applyCustomDateFilter"
            >
              Lọc theo ngày
            </button>
          </div>
        </div>

        <div class="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doanh thu thuần</span>
              <div class="mt-2 flex items-baseline gap-2">
                <span class="text-xl font-black text-slate-900 tracking-tight">{{ formatCurrency(totalRevenue) }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Giá vốn hàng bán (COGS)</span>
              <div class="mt-2 flex items-baseline gap-2">
                <span class="text-xl font-black text-slate-700 tracking-tight">{{ formatCurrency(totalCogs) }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lợi nhuận gộp</span>
              <div class="mt-2 flex items-baseline gap-2">
                <span class="text-xl font-black text-emerald-600 tracking-tight">{{ formatCurrency(totalGrossProfit) }}</span>
              </div>
              <div class="text-xs font-bold text-emerald-600 mt-1">Biên lãi: {{ grossMarginPercent }}%</div>
            </div>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng số đơn</span>
              <div class="mt-2 flex items-baseline gap-2">
                <span class="text-xl font-black text-blue-700 tracking-tight">{{ totalOrdersCount }}</span>
              </div>
              <div class="text-xs font-medium text-slate-400 mt-1">AOV: {{ formatCurrency(estimatedAov) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Overview Table -->
      <div class="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Bảng chi tiết doanh thu và lãi gộp theo ngày</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-150 bg-slate-50/50">
                <th class="py-4 px-6">Ngày</th>
                <th class="py-4 px-6">Số đơn</th>
                <th class="py-4 px-6">Doanh thu tạm tính</th>
                <th class="py-4 px-6">Đã giảm giá</th>
                <th class="py-4 px-6">Hoàn trả</th>
                <th class="py-4 px-6">Doanh thu thuần</th>
                <th class="py-4 px-6">Giá vốn (COGS)</th>
                <th class="py-4 px-6">Lợi nhuận gộp</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
              <tr v-for="row in reportData" :key="row._id" class="hover:bg-slate-50/50 transition-colors">
                <td class="py-4 px-6 font-bold text-slate-900">{{ row._id }}</td>
                <td class="py-4 px-6 font-bold text-slate-800">{{ row.count }}</td>
                <td class="py-4 px-6">{{ formatCurrency(row.subtotal) }}</td>
                <td class="py-4 px-6 text-red-500 font-semibold">-{{ formatCurrency(row.discount) }}</td>
                <td class="py-4 px-6 text-orange-500 font-semibold">{{ row.refund ? '-' + formatCurrency(row.refund) : '0đ' }}</td>
                <td class="py-4 px-6 font-black text-blue-700">{{ formatCurrency(row.total) }}</td>
                <td class="py-4 px-6 text-slate-600">{{ formatCurrency(row.cogs || 0) }}</td>
                <td class="py-4 px-6 font-bold text-emerald-600">{{ formatCurrency(row.grossProfit !== undefined ? row.grossProfit : (row.total - (row.cogs || 0))) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- VIEW 2: INVENTORY LEDGER & PROFIT (ERP-05) -->
    <div v-if="activeView === 'ledger'" class="space-y-4">
      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-base font-bold text-gray-900 dark:text-white">Báo Cáo Nhập Xuất Tồn & Lãi Gộp Sản Phẩm</h2>
          <p class="text-xs text-gray-500 mt-0.5">Theo dõi chi tiết tồn đầu kỳ, biến động nhập/xuất/kiểm kê, giá vốn xuất kho và lợi nhuận gộp từng mặt hàng</p>
        </div>
        <button
          class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-xs transition-colors shadow-sm"
          @click="exportLedgerExcel"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Xuất Excel Báo Cáo
        </button>
      </div>

      <!-- Ledger Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span class="text-[11px] font-semibold text-gray-400 uppercase">Tồn đầu kỳ</span>
          <div class="text-base font-bold text-gray-900 dark:text-white mt-1">{{ ledgerSummary.totalOpeningStock || 0 }}</div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span class="text-[11px] font-semibold text-emerald-600 uppercase">Nhập trong kỳ</span>
          <div class="text-base font-bold text-emerald-600 mt-1">+{{ ledgerSummary.totalImports || 0 }}</div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span class="text-[11px] font-semibold text-red-600 uppercase">Xuất trong kỳ</span>
          <div class="text-base font-bold text-red-600 mt-1">-{{ ledgerSummary.totalExports || 0 }}</div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span class="text-[11px] font-semibold text-blue-600 uppercase">Tồn cuối kỳ</span>
          <div class="text-base font-bold text-blue-600 mt-1">{{ ledgerSummary.totalClosingStock || 0 }}</div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span class="text-[11px] font-semibold text-gray-500 uppercase">Doanh thu thuần</span>
          <div class="text-sm font-bold text-gray-900 dark:text-white mt-1">{{ formatCurrency(ledgerSummary.totalRevenue || 0) }}</div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span class="text-[11px] font-semibold text-emerald-600 uppercase">Lãi gộp ({{ ledgerSummary.overallGrossMargin || 0 }}%)</span>
          <div class="text-sm font-bold text-emerald-600 mt-1">{{ formatCurrency(ledgerSummary.totalGrossProfit || 0) }}</div>
        </div>
      </div>

      <!-- Ledger Table -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden text-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-gray-50/80 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 uppercase font-semibold">
                <th class="py-3 px-4">Mã SKU & Tên sản phẩm</th>
                <th class="py-3 px-4">Danh mục</th>
                <th class="py-3 px-4 text-right">Giá vốn</th>
                <th class="py-3 px-4 text-center">Đầu kỳ</th>
                <th class="py-3 px-4 text-center text-emerald-600">Nhập</th>
                <th class="py-3 px-4 text-center text-red-600">Xuất</th>
                <th class="py-3 px-4 text-center text-amber-600">Kiểm kê</th>
                <th class="py-3 px-4 text-center font-bold text-blue-600">Cuối kỳ</th>
                <th class="py-3 px-4 text-right">Doanh thu</th>
                <th class="py-3 px-4 text-right">Giá vốn (COGS)</th>
                <th class="py-3 px-4 text-right font-bold text-emerald-600">Lãi gộp</th>
                <th class="py-3 px-4 text-center">Biên lãi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="ledgerLoading">
                <td colspan="12" class="py-8 text-center text-gray-400">Đang tổng hợp báo cáo nhập xuất tồn...</td>
              </tr>
              <tr v-else-if="ledgerData.length === 0">
                <td colspan="12" class="py-12 text-center text-gray-400">Không có dữ liệu trong khoảng thời gian này</td>
              </tr>
              <tr
                v-for="item in ledgerData"
                :key="item.productId"
                class="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td class="py-3 px-4">
                  <div class="font-bold text-gray-900 dark:text-white">{{ item.name }}</div>
                  <div class="text-[11px] text-gray-400 font-mono">{{ item.sku }}</div>
                </td>
                <td class="py-3 px-4 text-gray-600 dark:text-gray-300">{{ item.category }}</td>
                <td class="py-3 px-4 text-right font-medium">{{ formatCurrency(item.costPrice) }}</td>
                <td class="py-3 px-4 text-center font-medium">{{ item.openingStock }}</td>
                <td class="py-3 px-4 text-center font-bold text-emerald-600">+{{ item.importQty }}</td>
                <td class="py-3 px-4 text-center font-bold text-red-600">-{{ item.exportQty }}</td>
                <td class="py-3 px-4 text-center font-medium text-amber-600">{{ item.adjustQty }}</td>
                <td class="py-3 px-4 text-center font-extrabold text-blue-600">{{ item.closingStock }}</td>
                <td class="py-3 px-4 text-right font-medium">{{ formatCurrency(item.revenue) }}</td>
                <td class="py-3 px-4 text-right font-medium text-gray-500">{{ formatCurrency(item.cogs) }}</td>
                <td class="py-3 px-4 text-right font-bold text-emerald-600">{{ formatCurrency(item.grossProfit) }}</td>
                <td class="py-3 px-4 text-center font-bold text-blue-600">{{ item.grossMargin }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- VIEW 3: SMART REORDERING SUGGESTIONS (ERP-06) -->
    <div v-if="activeView === 'reorder'" class="space-y-4">
      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-base font-bold text-gray-900 dark:text-white">Đề Xuất Nhập Hàng Thông Minh</h2>
          <p class="text-xs text-gray-500 mt-0.5">Phân tích tốc độ bán (Run Rate 7/30/90 ngày), hàng đang chờ giao từ PO và dự báo số ngày còn tồn</p>
        </div>

        <div class="flex items-center gap-3">
          <label class="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              v-model="onlyLowStock"
              type="checkbox"
              class="rounded text-blue-600 focus:ring-blue-500"
              @change="loadReorderSuggestions"
            />
            Chỉ hiện sản phẩm cần nhập gấp
          </label>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden text-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-gray-50/80 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 uppercase font-semibold">
                <th class="py-3 px-4">Sản phẩm</th>
                <th class="py-3 px-4 text-center">Tồn kho</th>
                <th class="py-3 px-4 text-center">Tồn min / max</th>
                <th class="py-3 px-4 text-center">Bán 30 ngày (Tốc độ)</th>
                <th class="py-3 px-4 text-center">Đang đặt (PO)</th>
                <th class="py-3 px-4 text-center font-bold text-blue-600">Đề xuất nhập</th>
                <th class="py-3 px-4 text-center">Dự kiến hết</th>
                <th class="py-3 px-4 text-center">Mức độ khẩn</th>
                <th class="py-3 px-4">Nhà cung cấp đề xuất</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="reorderLoading">
                <td colspan="9" class="py-8 text-center text-gray-400">Đang phân tích dữ liệu bán hàng & gợi ý đặt mua...</td>
              </tr>
              <tr v-else-if="reorderData.length === 0">
                <td colspan="9" class="py-12 text-center text-gray-400">Tất cả sản phẩm đều đủ tồn kho an toàn</td>
              </tr>
              <tr
                v-for="sug in reorderData"
                :key="sug.productId"
                class="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td class="py-3 px-4">
                  <div class="font-bold text-gray-900 dark:text-white">{{ sug.name }}</div>
                  <div class="text-[11px] text-gray-400 font-mono">{{ sug.sku }}</div>
                </td>
                <td class="py-3 px-4 text-center font-bold" :class="sug.currentStock <= sug.minStock ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'">
                  {{ sug.currentStock }} {{ sug.unit }}
                </td>
                <td class="py-3 px-4 text-center text-gray-500">
                  {{ sug.minStock }} / {{ sug.targetStock }}
                </td>
                <td class="py-3 px-4 text-center">
                  <span class="font-bold text-gray-800 dark:text-gray-200">{{ sug.sales30d }}</span>
                  <span class="text-gray-400 text-[10px] block">({{ sug.dailyRunRate }}/ngày)</span>
                </td>
                <td class="py-3 px-4 text-center font-medium text-amber-600">
                  {{ sug.pendingPOQty > 0 ? `+${sug.pendingPOQty}` : '0' }}
                </td>
                <td class="py-3 px-4 text-center font-extrabold text-blue-600 text-sm">
                  {{ sug.suggestedQty }} {{ sug.unit }}
                </td>
                <td class="py-3 px-4 text-center font-medium">
                  {{ sug.daysUntilStockout >= 999 ? 'An toàn' : `${sug.daysUntilStockout} ngày` }}
                </td>
                <td class="py-3 px-4 text-center">
                  <span :class="urgencyBadgeClass(sug.urgency)" class="px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    {{ urgencyLabel(sug.urgency) }}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">
                  <div>{{ sug.supplierName }}</div>
                  <div class="text-[10px] text-gray-400">Giao ~{{ sug.leadTimeDays }} ngày</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { reportService } from '@/services/report.service'
import { formatCurrency } from '@/utils/helpers'

const toast = useToast()

const activeView = ref<'overview' | 'ledger' | 'reorder'>('overview')

// Overview state
const reportData = ref<any[]>([])
const categoryRevenueList = ref<any[]>([])
const summaryKpis = ref<any>(null)
const loading = ref(false)
const errorMessage = ref('')

const startDate = ref('')
const endDate = ref('')
const selectedChannel = ref('ALL')
const selectedRange = ref('month')

const rangePresets = [
  { label: 'Hôm nay', value: 'today' },
  { label: '7 ngày qua', value: 'week' },
  { label: 'Tháng này', value: 'month' },
  { label: 'Năm nay', value: 'year' },
]

// Ledger state (ERP-05)
const ledgerData = ref<any[]>([])
const ledgerSummary = ref<any>({})
const ledgerLoading = ref(false)

// Reorder state (ERP-06)
const reorderData = ref<any[]>([])
const reorderLoading = ref(false)
const onlyLowStock = ref(true)

function switchView(view: 'overview' | 'ledger' | 'reorder') {
  activeView.value = view
  if (view === 'ledger' && ledgerData.value.length === 0) {
    loadLedgerReport()
  } else if (view === 'reorder' && reorderData.value.length === 0) {
    loadReorderSuggestions()
  }
}

function updateDateRangeByPreset(preset: string) {
  selectedRange.value = preset
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  if (preset === 'today') {
    startDate.value = todayStr
    endDate.value = todayStr
  } else if (preset === 'week') {
    const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    startDate.value = past.toISOString().slice(0, 10)
    endDate.value = todayStr
  } else if (preset === 'month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    startDate.value = firstDay.toISOString().slice(0, 10)
    endDate.value = todayStr
  } else if (preset === 'year') {
    const firstDayYear = new Date(now.getFullYear(), 0, 1)
    startDate.value = firstDayYear.toISOString().slice(0, 10)
    endDate.value = todayStr
  }
}

function selectPreset(preset: string) {
  updateDateRangeByPreset(preset)
  loadAllReports()
}

function onCustomDateChange() {
  selectedRange.value = 'custom'
}

function onChannelChange() {
  loadAllReports()
}

function applyCustomDateFilter() {
  selectedRange.value = 'custom'
  loadAllReports()
}

async function loadAllReports() {
  loading.value = true
  errorMessage.value = ''

  try {
    const rangeParam = selectedRange.value !== 'custom' ? (selectedRange.value as any) : undefined

    const [revenueRes, summaryRes, catRes] = await Promise.all([
      reportService.getRevenue(startDate.value, endDate.value, selectedChannel.value),
      reportService.getSummary(rangeParam),
      reportService.getCategoryRevenue(startDate.value, endDate.value, selectedChannel.value).catch(() => ({ data: [] })),
    ])

    reportData.value = revenueRes.data || []
    if (summaryRes?.data?.kpis) {
      summaryKpis.value = summaryRes.data.kpis
    }
    categoryRevenueList.value = catRes?.data || summaryRes?.data?.categoryRevenue || []
  } catch {
    errorMessage.value = 'Lỗi khi tải dữ liệu báo cáo từ máy chủ. Vui lòng thử lại!'
    toast.error('Lỗi khi tải báo cáo doanh thu')
  } finally {
    loading.value = false
  }
}

async function loadLedgerReport() {
  ledgerLoading.value = true
  try {
    const res = await reportService.getInventoryLedgerProfit({
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined,
      channel: selectedChannel.value || undefined,
    })
    ledgerData.value = res.data?.data || []
    ledgerSummary.value = res.data?.summary || {}
  } catch {
    toast.error('Không thể tải báo cáo nhập xuất tồn')
  } finally {
    ledgerLoading.value = false
  }
}

async function exportLedgerExcel() {
  try {
    const res = await reportService.exportInventoryLedgerProfit({
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined,
      channel: selectedChannel.value || undefined,
    })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `nhap-xuat-ton-lai-gop-${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    toast.success('Xuất file Excel thành công')
  } catch {
    toast.error('Không thể xuất file Excel')
  }
}

async function loadReorderSuggestions() {
  reorderLoading.value = true
  try {
    const res = await reportService.getReorderSuggestions({
      onlyLowStock: onlyLowStock.value,
    })
    reorderData.value = res.data?.data || []
  } catch {
    toast.error('Không thể tải danh sách đề xuất nhập hàng')
  } finally {
    reorderLoading.value = false
  }
}

function urgencyLabel(urgency: string): string {
  switch (urgency) {
    case 'CRITICAL': return 'Cần nhập gấp'
    case 'HIGH': return 'Sắp hết hàng'
    case 'MEDIUM': return 'Theo dõi'
    case 'LOW': return 'Đủ an toàn'
    default: return urgency
  }
}

function urgencyBadgeClass(urgency: string): string {
  switch (urgency) {
    case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200'
    case 'HIGH': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200'
    case 'MEDIUM': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200'
    case 'LOW': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200'
    default: return 'bg-gray-100 text-gray-700'
  }
}

onMounted(() => {
  updateDateRangeByPreset('month')
  loadAllReports()
})

const totalRevenue = computed(() => {
  return reportData.value.reduce((sum, row) => sum + (row.total || 0), 0)
})

const totalOrdersCount = computed(() => {
  return reportData.value.reduce((sum, row) => sum + (row.count || 0), 0)
})

const totalCogs = computed(() => {
  return reportData.value.reduce((sum, row) => sum + (row.cogs || 0), 0)
})

const totalGrossProfit = computed(() => {
  return reportData.value.reduce(
    (sum, row) =>
      sum +
      (row.grossProfit !== undefined
        ? row.grossProfit
        : (row.total || 0) - (row.cogs || 0)),
    0,
  )
})

const grossMarginPercent = computed(() => {
  if (totalRevenue.value <= 0) return '0.0'
  return ((totalGrossProfit.value / totalRevenue.value) * 100).toFixed(1)
})

const estimatedAov = computed(() => {
  if (totalOrdersCount.value === 0) return 0
  return Math.round(totalRevenue.value / totalOrdersCount.value)
})
</script>
