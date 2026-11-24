<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
      <div>
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">🛍️</span>
          <h1 class="text-xl font-black text-slate-900 tracking-tight">Bán Hàng Đa Kênh — TikTok Shop Pilot</h1>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-700">
            Release R3
          </span>
        </div>
        <p class="text-xs text-slate-500 font-medium mt-1">
          Quản lý kết nối TikTok Shop, ánh xạ SKU & tỷ lệ đóng gói, đồng bộ tồn kho khả dụng, tiếp nhận đơn webhook và đối soát doanh thu sàn
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          :disabled="syncingStock"
          class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          @click="triggerSyncInventory"
        >
          <span v-if="syncingStock" class="animate-spin">⏳</span>
          <span>{{ syncingStock ? 'Đang đẩy tồn...' : '🔄 Đồng bộ tồn kho ngay' }}</span>
        </button>
        <button
          class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          @click="openCreateMappingModal"
        >
          <span>+ Ánh Xạ SKU Mới</span>
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-slate-200 gap-2">
      <button
        class="py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2"
        :class="activeTab === 'mappings' ? 'border-[#dc2626] text-[#dc2626]' : 'border-transparent text-slate-500 hover:text-slate-800'"
        @click="activeTab = 'mappings'"
      >
        <span>📦 Ánh xạ SKU & Tồn kho ({{ mappings.length }})</span>
      </button>
      <button
        class="py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2"
        :class="activeTab === 'inbox' ? 'border-[#dc2626] text-[#dc2626]' : 'border-transparent text-slate-500 hover:text-slate-800'"
        @click="activeTab = 'inbox'"
      >
        <span>📥 Webhook & Đơn hàng sàn</span>
        <span v-if="exceptions.length > 0" class="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 font-black">
          {{ exceptions.length }} lỗi
        </span>
      </button>
      <button
        class="py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2"
        :class="activeTab === 'reconciliation' ? 'border-[#dc2626] text-[#dc2626]' : 'border-transparent text-slate-500 hover:text-slate-800'"
        @click="activeTab = 'reconciliation'"
      >
        <span>⚖️ Đối soát doanh thu sàn ({{ settlements.length }})</span>
      </button>
      <button
        class="py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2"
        :class="activeTab === 'accounts' ? 'border-[#dc2626] text-[#dc2626]' : 'border-transparent text-slate-500 hover:text-slate-800'"
        @click="activeTab = 'accounts'"
      >
        <span>🔌 Cấu hình Kênh bán ({{ accounts.length }})</span>
      </button>
    </div>

    <!-- TAB 1: SKU MAPPINGS & INVENTORY (CHN-02) -->
    <div v-if="activeTab === 'mappings'" class="space-y-4">
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h2 class="text-xs font-black text-slate-900">Danh sách SKU đã ánh xạ giữa TikTok Shop và Kho nội bộ</h2>
            <p class="text-[11px] text-slate-500 mt-0.5">
              Tồn kho khả dụng sàn = Floor(Tồn kho nội bộ / Tỷ lệ đóng gói). Khi có đơn hàng từ sàn hoặc POS/Web, tồn kho sẽ trừ nguyên tử tương ứng.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="searchSku"
              type="text"
              placeholder="Tìm theo mã SKU hoặc tên..."
              class="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium bg-white"
            />
          </div>
        </div>

        <!-- Mappings Table -->
        <div v-if="filteredMappings.length === 0" class="p-12 text-center text-xs text-slate-400">
          Chưa có SKU nào được ánh xạ. Bấm "+ Ánh Xạ SKU Mới" ở góc phải để tạo liên kết.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-3">Kênh sàn</th>
                <th class="py-2.5 px-3">SKU Sàn (TikTok Shop)</th>
                <th class="py-2.5 px-3">Sản phẩm Kho nội bộ</th>
                <th class="py-2.5 px-3 text-center">Tỷ lệ quy đổi</th>
                <th class="py-2.5 px-3 text-right">Tồn kho nội bộ</th>
                <th class="py-2.5 px-3 text-right">Tồn đẩy lên sàn</th>
                <th class="py-2.5 px-3 text-center">Trạng thái</th>
                <th class="py-2.5 px-3 text-right">Cập nhật</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
              <tr v-for="m in filteredMappings" :key="m._id" class="hover:bg-slate-50/50">
                <td class="py-2.5 px-3 font-bold">
                  <span class="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-white font-extrabold">
                    {{ m.provider }}
                  </span>
                </td>
                <td class="py-2.5 px-3">
                  <div class="font-bold text-slate-900">{{ m.externalSkuName }}</div>
                  <span class="text-[10px] text-slate-400">SKU ID: {{ m.externalSkuId }}</span>
                </td>
                <td class="py-2.5 px-3">
                  <div class="font-bold text-blue-700">{{ m.productId?.name || 'Sản phẩm nội bộ' }}</div>
                  <span class="text-[10px] text-slate-400">Mã kho: {{ m.sku }}</span>
                </td>
                <td class="py-2.5 px-3 text-center font-bold">
                  1 hộp = {{ m.packMultiplier || 1 }} chiếc
                </td>
                <td class="py-2.5 px-3 text-right font-bold">
                  {{ m.productId?.stock ?? 'N/A' }}
                </td>
                <td class="py-2.5 px-3 text-right font-black text-emerald-700">
                  {{ m.lastStockPushed }}
                </td>
                <td class="py-2.5 px-3 text-center">
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-black"
                    :class="m.syncStatus === 'SYNCED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
                  >
                    {{ m.syncStatus }}
                  </span>
                </td>
                <td class="py-2.5 px-3 text-right text-slate-400 text-[10px]">
                  {{ formatDate(m.lastPushedAt || m.updatedAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: WEBHOOK INBOX & EXCEPTIONS (CHN-03) -->
    <div v-if="activeTab === 'inbox'" class="space-y-6">
      <!-- Exceptions Quarantine Card -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xs font-black text-slate-900 flex items-center gap-2">
              <span>⚠️ Danh sách Đơn hàng sàn bị cách ly (Quarantined Exceptions)</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-extrabold">
                {{ exceptions.length }} cần xử lý
              </span>
            </h2>
            <p class="text-[11px] text-slate-500 mt-0.5">
              Đơn hàng TikTok Shop chứa SKU chưa ánh xạ hoặc không đủ tồn kho sẽ tự động vào hàng đợi cách ly để nhân viên xử lý, không gây đứt gãy hệ thống.
            </p>
          </div>

          <button
            class="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
            @click="fetchExceptions"
          >
            Làm mới
          </button>
        </div>

        <div v-if="exceptions.length === 0" class="p-6 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
          <span>✓</span>
          <span>Không có đơn hàng sàn nào bị cách ly hoặc lỗi tồn kho. Mọi đơn webhook đều được xử lý chuẩn xác!</span>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="exc in exceptions"
            :key="exc._id"
            class="p-4 bg-rose-50/50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black">
                  {{ exc.exceptionType }}
                </span>
                <span class="text-xs font-bold text-slate-900">Mã đơn sàn: {{ exc.externalOrderId }}</span>
              </div>
              <p class="text-xs text-rose-900 font-medium">{{ exc.message }}</p>
              <span class="text-[10px] text-slate-400">Xảy ra lúc: {{ formatDate(exc.createdAt) }}</span>
            </div>

            <button
              class="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-lg transition-all cursor-pointer shadow-2xs"
              @click="resolveException(exc._id)"
            >
              ✓ Đã xử lý xong
            </button>
          </div>
        </div>
      </div>

      <!-- Webhook Sandbox Simulator (QA-03) -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <h3 class="text-xs font-black text-slate-900">🧪 Bộ công cụ Thử nghiệm Webhook TikTok Shop (Sandbox Simulator)</h3>
        <p class="text-[11px] text-slate-500">
          Mô phỏng gửi webhook `ORDER_CREATED` hoặc `ORDER_CANCELLED` từ TikTok Shop để kiểm tra luồng nhận đơn, trừ tồn kho và xác minh HMAC chữ ký.
        </p>

        <div class="flex flex-wrap items-center gap-2">
          <button
            class="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            @click="simulateOrderCreated"
          >
            <span>📦 Mô phỏng đơn hàng mới (ORDER_CREATED)</span>
          </button>
          <button
            class="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            @click="simulateOrderCancelled"
          >
            <span>✕ Mô phỏng khách hủy đơn (ORDER_CANCELLED)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- TAB 3: RECONCILIATION & SETTLEMENTS (CHN-04) -->
    <div v-if="activeTab === 'reconciliation'" class="space-y-4">
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h2 class="text-xs font-black text-slate-900">Đối soát Doanh thu & Bảng kê thanh toán TikTok Shop</h2>
            <p class="text-[11px] text-slate-500 mt-0.5">
              Đối chiếu số tiền TikTok Shop chuyển khoản (Net Settlement) sau khi trừ phí hoa hồng/phí nền tảng với tổng doanh thu đơn hàng ghi nhận nội bộ.
            </p>
          </div>

          <button
            class="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
            @click="showSettlementModal = true"
          >
            + Nhập kỳ đối soát mới
          </button>
        </div>

        <div v-if="settlements.length === 0" class="p-12 text-center text-xs text-slate-400">
          Chưa có kỳ đối soát nào. Nhấn "+ Nhập kỳ đối soát mới" để kiểm tra số liệu.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-3">Mã quyết toán</th>
                <th class="py-2.5 px-3">Kỳ đối soát</th>
                <th class="py-2.5 px-3 text-right">Doanh số sàn báo (Gross)</th>
                <th class="py-2.5 px-3 text-right">Phí sàn khấu trừ</th>
                <th class="py-2.5 px-3 text-right">Thực nhận ngân hàng</th>
                <th class="py-2.5 px-3 text-right">Doanh thu đơn nội bộ</th>
                <th class="py-2.5 px-3 text-right">Chênh lệch</th>
                <th class="py-2.5 px-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
              <tr v-for="s in settlements" :key="s._id" class="hover:bg-slate-50/50">
                <td class="py-2.5 px-3 font-bold text-slate-900">{{ s.settlementId }}</td>
                <td class="py-2.5 px-3 text-slate-600">
                  {{ formatDateOnly(s.periodStart) }} - {{ formatDateOnly(s.periodEnd) }}
                </td>
                <td class="py-2.5 px-3 text-right font-bold">{{ formatCurrency(s.grossSalesVnd) }}</td>
                <td class="py-2.5 px-3 text-right text-rose-600">-{{ formatCurrency(s.platformFeesVnd) }}</td>
                <td class="py-2.5 px-3 text-right font-black text-purple-700">{{ formatCurrency(s.netSettlementVnd) }}</td>
                <td class="py-2.5 px-3 text-right font-bold text-blue-700">{{ formatCurrency(s.internalAttributedSalesVnd) }}</td>
                <td class="py-2.5 px-3 text-right font-black" :class="s.discrepancyVnd === 0 ? 'text-emerald-600' : 'text-amber-600'">
                  {{ s.discrepancyVnd === 0 ? 'Khớp 0 ₫' : formatCurrency(s.discrepancyVnd) }}
                </td>
                <td class="py-2.5 px-3 text-center">
                  <span
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-black"
                    :class="s.status === 'RECONCILED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                  >
                    {{ s.status === 'RECONCILED' ? '✓ Khớp hoàn toàn' : '⚠️ Lệch số liệu' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 4: CHANNEL ACCOUNTS (CHN-01) -->
    <div v-if="activeTab === 'accounts'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="acc in accounts"
          :key="acc._id"
          class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">🎵</span>
              <div>
                <h3 class="text-xs font-black text-slate-900">{{ acc.shopName }}</h3>
                <span class="text-[10px] text-slate-400">Shop ID: {{ acc.shopId }}</span>
              </div>
            </div>

            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-extrabold"
              :class="acc.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'"
            >
              {{ acc.status === 'ACTIVE' ? '● Đang hoạt động' : '○ Tạm ngắt' }}
            </span>
          </div>

          <div class="space-y-1 text-xs text-slate-600">
            <div><strong>Tự động đồng bộ tồn:</strong> {{ acc.syncStockEnabled ? 'Bật' : 'Tắt' }}</div>
            <div><strong>Tự động đồng bộ đơn:</strong> {{ acc.syncOrdersEnabled ? 'Bật' : 'Tắt' }}</div>
            <div class="text-[10px] text-slate-400 pt-1">
              Đồng bộ gần nhất: {{ acc.lastSyncedAt ? formatDate(acc.lastSyncedAt) : 'Chưa đồng bộ' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Tạo liên kết SKU mới (CHN-02) -->
    <div
      v-if="showCreateMappingModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
        <h3 class="text-sm font-black text-slate-900">Thêm Ánh Xạ SKU TikTok Shop</h3>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Mã SKU trên TikTok Shop *</label>
          <input
            v-model="mappingForm.externalSkuId"
            type="text"
            placeholder="Ví dụ: tts_sku_1001"
            class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Tên hiển thị trên TikTok Shop *</label>
          <input
            v-model="mappingForm.externalSkuName"
            type="text"
            placeholder="Ví dụ: Hộp 20 Bút bi Thiên Long TL-027"
            class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Sản phẩm kho nội bộ tương ứng *</label>
          <select
            v-model="mappingForm.productId"
            class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white"
          >
            <option value="">-- Chọn sản phẩm nội bộ --</option>
            <option v-for="p in products" :key="p._id" :value="p._id">
              {{ p.name }} (SKU: {{ p.sku }}) - Tồn: {{ p.stock }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Tỷ lệ đóng gói quy đổi (Pack Multiplier)</label>
          <input
            v-model.number="mappingForm.packMultiplier"
            type="number"
            min="1"
            placeholder="1"
            class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white"
          />
          <span class="text-[10px] text-slate-400 mt-1 block">
            Ví dụ: Nếu bán theo hộp 20 chiếc thì nhập 20. Khi bán 1 hộp sàn, kho nội bộ trừ đúng 20 chiếc.
          </span>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            class="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            @click="showCreateMappingModal = false"
          >
            Hủy
          </button>
          <button
            class="px-4 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer disabled:opacity-50"
            :disabled="!mappingForm.externalSkuId || !mappingForm.productId"
            @click="submitCreateMapping"
          >
            Lưu liên kết SKU
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: Nhập kỳ đối soát mới (CHN-04) -->
    <div
      v-if="showSettlementModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
        <h3 class="text-sm font-black text-slate-900">Nhập Bảng kê Thanh toán Đối soát</h3>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Mã bảng kê (Statement ID) *</label>
          <input
            v-model="settlementForm.settlementId"
            type="text"
            placeholder="Ví dụ: STMT_TTS_202611_01"
            class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white"
          />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Từ ngày *</label>
            <input
              v-model="settlementForm.periodStart"
              type="date"
              class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Đến ngày *</label>
            <input
              v-model="settlementForm.periodEnd"
              type="date"
              class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Doanh số sàn báo (Gross Sales VND) *</label>
          <input
            v-model.number="settlementForm.grossSalesVnd"
            type="number"
            placeholder="25000000"
            class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Tổng phí sàn khấu trừ (VND) *</label>
          <input
            v-model.number="settlementForm.platformFeesVnd"
            type="number"
            placeholder="1250000"
            class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Thực nhận chuyển khoản (Net Settlement VND) *</label>
          <input
            v-model.number="settlementForm.netSettlementVnd"
            type="number"
            placeholder="23750000"
            class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white"
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            class="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            @click="showSettlementModal = false"
          >
            Hủy
          </button>
          <button
            class="px-4 py-2 text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 rounded-xl cursor-pointer disabled:opacity-50"
            :disabled="!settlementForm.settlementId || !settlementForm.netSettlementVnd"
            @click="submitRecordSettlement"
          >
            Chạy đối soát
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import {
  channelsService,
  type ChannelAccount,
  type ChannelSkuMapping,
  type ChannelException,
  type ChannelSettlement,
} from '../../services/channels.service';
import { productService } from '../../services/product.service';

const activeTab = ref<'mappings' | 'inbox' | 'reconciliation' | 'accounts'>('mappings');

const accounts = ref<ChannelAccount[]>([]);
const mappings = ref<ChannelSkuMapping[]>([]);
const exceptions = ref<ChannelException[]>([]);
const settlements = ref<ChannelSettlement[]>([]);
const products = ref<any[]>([]);

const searchSku = ref('');
const syncingStock = ref(false);

const filteredMappings = computed(() => {
  if (!searchSku.value.trim()) return mappings.value;
  const q = searchSku.value.toLowerCase();
  return mappings.value.filter(
    (m) =>
      m.externalSkuName?.toLowerCase().includes(q) ||
      m.externalSkuId?.toLowerCase().includes(q) ||
      m.sku?.toLowerCase().includes(q),
  );
});

// Modals
const showCreateMappingModal = ref(false);
const mappingForm = reactive({
  provider: 'TIKTOK_SHOP',
  shopId: 'tts_shop_vn_01',
  externalSkuId: '',
  externalProductId: 'ext_prod_default',
  externalSkuName: '',
  productId: '',
  packMultiplier: 1,
});

const showSettlementModal = ref(false);
const settlementForm = reactive({
  settlementId: '',
  provider: 'TIKTOK_SHOP',
  shopId: 'tts_shop_vn_01',
  periodStart: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
  periodEnd: new Date().toISOString().split('T')[0],
  grossSalesVnd: 0,
  platformFeesVnd: 0,
  netSettlementVnd: 0,
});

function formatCurrency(val?: number): string {
  return (val || 0).toLocaleString('vi-VN') + ' ₫';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateOnly(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

// Fetch APIs
async function fetchAccounts() {
  try {
    const res = await channelsService.getAccounts();
    accounts.value = res.data || [];
  } catch {
    // Graceful fallback
  }
}

async function fetchMappings() {
  try {
    const res = await channelsService.getMappings();
    mappings.value = res.data || [];
  } catch {
    // Graceful fallback
  }
}

async function fetchExceptions() {
  try {
    const res = await channelsService.getExceptions(false);
    exceptions.value = res.data || [];
  } catch {
    // Graceful fallback
  }
}

async function fetchSettlements() {
  try {
    const res = await channelsService.getSettlements();
    settlements.value = res.data || [];
  } catch {
    // Graceful fallback
  }
}

async function fetchProducts() {
  try {
    const res = await productService.getAll({ limit: 50 });
    products.value = res.data?.items || res.data || [];
  } catch {
    // Graceful fallback
  }
}

// Actions
async function triggerSyncInventory() {
  syncingStock.value = true;
  try {
    const res = await channelsService.syncInventory();
    alert(`Đã đồng bộ tồn kho thành công cho ${res.data?.syncedCount || 0} liên kết SKU!`);
    await fetchMappings();
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Lỗi đồng bộ tồn kho');
  } finally {
    syncingStock.value = false;
  }
}

function openCreateMappingModal() {
  mappingForm.externalSkuId = '';
  mappingForm.externalSkuName = '';
  mappingForm.productId = '';
  mappingForm.packMultiplier = 1;
  showCreateMappingModal.value = true;
}

async function submitCreateMapping() {
  if (!mappingForm.externalSkuId || !mappingForm.productId) return;
  const prod = products.value.find((p) => p._id === mappingForm.productId);
  try {
    await channelsService.createMapping({
      provider: mappingForm.provider,
      shopId: mappingForm.shopId,
      externalSkuId: mappingForm.externalSkuId,
      externalProductId: mappingForm.externalProductId,
      externalSkuName: mappingForm.externalSkuName,
      productId: mappingForm.productId,
      sku: prod?.sku || 'SKU_MAP',
      packMultiplier: mappingForm.packMultiplier,
    });
    showCreateMappingModal.value = false;
    await fetchMappings();
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Lỗi khi tạo liên kết SKU');
  }
}

async function resolveException(id: string) {
  const notes = prompt('Nhập ghi chú xử lý ngoại lệ:');
  if (notes !== null) {
    try {
      await channelsService.resolveException(id, notes || 'Đã xử lý thủ công');
      await fetchExceptions();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi xử lý ngoại lệ');
    }
  }
}

async function submitRecordSettlement() {
  try {
    await channelsService.recordSettlement({
      settlementId: settlementForm.settlementId,
      provider: settlementForm.provider,
      shopId: settlementForm.shopId,
      periodStart: settlementForm.periodStart,
      periodEnd: settlementForm.periodEnd,
      grossSalesVnd: settlementForm.grossSalesVnd,
      platformFeesVnd: settlementForm.platformFeesVnd,
      netSettlementVnd: settlementForm.netSettlementVnd,
    });
    showSettlementModal.value = false;
    await fetchSettlements();
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Lỗi khi đối soát');
  }
}

// Sandbox Simulator (QA-03)
async function simulateOrderCreated() {
  const extOrderId = `tts_${Date.now()}`;
  try {
    const res = await channelsService.simulateWebhook('TIKTOK_SHOP', {
      eventId: `evt_sim_${Date.now()}`,
      provider: 'TIKTOK_SHOP',
      shopId: 'tts_shop_vn_01',
      eventType: 'ORDER_CREATED',
      payload: {
        orderId: extOrderId,
        items: [
          {
            externalSkuId: mappings.value[0]?.externalSkuId || 'ext_sku_default',
            quantity: 1,
            price: 50000,
          },
        ],
        subtotal: 50000,
        totalAmount: 50000,
        recipientName: 'Khách hàng TikTok Test',
        recipientPhone: '0912345678',
        shippingAddress: '123 Đường Test, TP.HCM',
      },
    });
    alert(`Kết quả mô phỏng: ${res.data?.status} — ${res.data?.message || ''}`);
    await fetchExceptions();
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Lỗi mô phỏng');
  }
}

async function simulateOrderCancelled() {
  try {
    const res = await channelsService.simulateWebhook('TIKTOK_SHOP', {
      eventId: `evt_cancel_${Date.now()}`,
      provider: 'TIKTOK_SHOP',
      shopId: 'tts_shop_vn_01',
      eventType: 'ORDER_CANCELLED',
      payload: {
        orderId: 'tts_sample_id',
      },
    });
    alert(`Kết quả hủy đơn: ${res.data?.status} — ${res.data?.message || ''}`);
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Lỗi mô phỏng');
  }
}

onMounted(() => {
  fetchAccounts();
  fetchMappings();
  fetchExceptions();
  fetchSettlements();
  fetchProducts();
});
</script>
