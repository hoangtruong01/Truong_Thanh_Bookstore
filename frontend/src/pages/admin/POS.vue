<template>
  <div class="space-y-6">
    <!-- Header with Top Navigation & Action -->
    <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-red-50 text-[#dc2626] flex items-center justify-center font-bold shadow-xs">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6H2.25m0 0v-.75A.75.75 0 0 1 3 4.5h.75m0 0h16.5m0 0h.75A.75.75 0 0 1 21 5.25v.75m0 0h-.75A.75.75 0 0 1 19.5 5.25v-.75m0 0v14.25m-16.5 0v-14.25" />
          </svg>
        </div>
        <div>
          <h2 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Bán hàng tại quầy (POS)</h2>
          <p class="text-[11px] text-slate-400 font-semibold">Tạo hóa đơn, quét mã vạch, trừ kho tức thời và in phiếu bán hàng.</p>
        </div>
      </div>

      <!-- Mode Tabs -->
      <div class="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
        <button
          type="button"
          :class="['px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer', activeMode === 'pos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800']"
          @click="activeMode = 'pos'"
        >
          Thu ngân & Bán hàng
        </button>
        <button
          type="button"
          :class="['px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer', activeMode === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800']"
          @click="switchToHistory"
        >
          Lịch sử hóa đơn
        </button>
        <button
          type="button"
          :class="['px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer', activeMode === 'report' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800']"
          @click="loadSessionReport"
        >
          Báo cáo ca bán
        </button>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- VIEW 1: POS SCREEN (QUẦY THU NGÂN)        -->
    <!-- ========================================== -->
    <div v-if="activeMode === 'pos'" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left: Products Catalog & Search (7 cols) -->
      <div class="lg:col-span-7 space-y-4">
        <!-- Search bar with Barcode scanner support -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </span>
            <input
              ref="barcodeInputRef"
              v-model="productSearchQuery"
              type="text"
              placeholder="Quét mã vạch (Barcode), nhập mã SKU hoặc tên sản phẩm... (Enter để thêm ngay)"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-24 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
              @keydown.enter.prevent="handleBarcodeEnter"
              @input="onSearchInput"
            />
            <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] font-bold text-slate-400 pointer-events-none">
              Scanner [Auto]
            </span>
          </div>

          <!-- Dropdown search suggestions if typing -->
          <div v-if="searchResults.length > 0" class="max-h-60 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 shadow-lg bg-white">
            <div
              v-for="item in searchResults"
              :key="item._id"
              class="p-2.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
              @click="addProductToCart(item)"
            >
              <div class="flex items-center gap-3">
                <img
                  v-if="item.images && item.images[0]"
                  :src="item.images[0]"
                  class="w-9 h-9 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                />
                <div v-else class="w-9 h-9 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                  {{ item.name.slice(0, 2).toUpperCase() }}
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-900 leading-tight">{{ item.name }}</p>
                  <p class="text-[10px] text-slate-400 font-mono mt-0.5">
                    SKU: {{ item.sku || 'N/A' }} | Tồn: <span :class="item.stock > 0 ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'">{{ item.stock }} {{ item.unit || 'cái' }}</span>
                  </p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-xs font-extrabold text-[#dc2626]">{{ formatPrice(getItemEffectivePrice(item)) }}</span>
                <span v-if="item.discountPrice > 0" class="block text-[9px] text-slate-400 line-through">{{ formatPrice(item.price) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Category Browsing or Product Grid -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Danh mục sản phẩm</h3>
            <span class="text-[11px] font-semibold text-slate-400">Bấm sản phẩm để thêm vào đơn</span>
          </div>

          <div v-if="loadingProducts" class="py-12 text-center text-slate-400 text-xs">
            Đang tải dữ liệu sản phẩm...
          </div>

          <div v-else-if="catalogProducts.length === 0" class="py-12 text-center text-slate-400 text-xs">
            Không có sản phẩm nào đang hoạt động.
          </div>

          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto pr-1">
            <div
              v-for="p in catalogProducts"
              :key="p._id"
              :class="[
                'border rounded-xl p-2.5 flex flex-col justify-between transition-all select-none',
                p.stock > 0
                  ? 'border-slate-200 hover:border-[#dc2626] hover:shadow-xs cursor-pointer bg-white'
                  : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
              ]"
              @click="p.stock > 0 && addProductToCart(p)"
            >
              <div>
                <div class="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-100 mb-2">
                  <img
                    v-if="p.images && p.images[0]"
                    :src="p.images[0]"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-slate-400 font-extrabold text-sm">
                    {{ p.name.slice(0, 2).toUpperCase() }}
                  </div>
                  <span
                    v-if="p.stock <= 0"
                    class="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs"
                  >
                    Hết hàng
                  </span>
                </div>
                <h4 class="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight" :title="p.name">
                  {{ p.name }}
                </h4>
                <p class="text-[9px] font-mono text-slate-400 mt-0.5">{{ p.sku || 'N/A' }}</p>
              </div>

              <div class="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span class="text-xs font-extrabold text-[#dc2626]">
                    {{ formatPrice(getItemEffectivePrice(p)) }}
                  </span>
                </div>
                <span class="text-[9px] font-bold text-slate-500">
                  Tồn: {{ p.stock }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Active Cart & Billing (5 cols) -->
      <div class="lg:col-span-5 space-y-4">
        <!-- Multi-cart Hold Tabs (POS-09) -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
          <div
            v-for="(cart, index) in heldCarts"
            :key="cart.id"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border',
              activeCartIndex === index
                ? 'bg-[#dc2626] text-white border-[#dc2626] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            ]"
            @click="activeCartIndex = index"
          >
            <span>{{ cart.name }} ({{ cart.items.length }})</span>
            <button
              v-if="heldCarts.length > 1"
              type="button"
              class="text-xs opacity-70 hover:opacity-100 cursor-pointer"
              @click.stop="removeHeldCart(index)"
            >
              ✕
            </button>
          </div>
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Thêm giỏ đơn mới (Lưu đơn tạm)"
            @click="addNewHeldCart"
          >
            + Đơn mới
          </button>
        </div>

        <!-- Cart Box -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
          <!-- Customer Selection Box -->
          <div class="border border-slate-100 bg-slate-50/50 rounded-xl p-3 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Khách hàng</span>
              <!-- Toggle Retail / Wholesale (POS-06) -->
              <div class="flex items-center bg-slate-200 rounded-lg p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  :class="['px-2 py-0.5 rounded cursor-pointer transition-all', currentCart.customerType === 'RETAIL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500']"
                  @click="setCustomerType('RETAIL')"
                >
                  Khách lẻ
                </button>
                <button
                  type="button"
                  :class="['px-2 py-0.5 rounded cursor-pointer transition-all', currentCart.customerType === 'WHOLESALE' ? 'bg-[#dc2626] text-white shadow-xs' : 'text-slate-500']"
                  @click="setCustomerType('WHOLESALE')"
                >
                  Khách sỉ
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <input
                v-model="currentCart.customerName"
                type="text"
                placeholder="Tên khách hàng"
                class="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
              />
              <input
                v-model="currentCart.customerPhone"
                type="text"
                placeholder="Số điện thoại"
                class="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
              />
            </div>
          </div>

          <!-- Cart Items Table -->
          <div class="space-y-2">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <span>Sản phẩm</span>
              <span>Thành tiền</span>
            </div>

            <div v-if="currentCart.items.length === 0" class="py-10 text-center text-slate-400 text-xs font-semibold">
              Giỏ hàng đang trống. Quét mã vạch hoặc chọn sản phẩm từ danh mục để bắt đầu.
            </div>

            <div v-else class="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              <div
                v-for="(item, idx) in currentCart.items"
                :key="item.productId"
                class="border border-slate-100 rounded-xl p-2.5 bg-slate-50/30 flex items-start justify-between gap-2"
              >
                <div class="space-y-1.5 flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-1">
                    <p class="text-xs font-bold text-slate-900 truncate leading-snug">{{ item.name }}</p>
                    <button
                      type="button"
                      class="text-slate-400 hover:text-red-500 text-xs font-bold cursor-pointer"
                      @click="removeCartItem(idx)"
                    >
                      ✕
                    </button>
                  </div>

                  <!-- Unit & Quantity row -->
                  <div class="flex items-center gap-2">
                    <!-- Unit Selector (POS-05) -->
                    <select
                      v-if="item.availableUnits && item.availableUnits.length > 1"
                      v-model="item.unit"
                      class="bg-white border border-slate-200 rounded-lg text-[10px] font-bold px-1.5 py-0.5 text-slate-700"
                      @change="onItemUnitChange(item)"
                    >
                      <option v-for="u in item.availableUnits" :key="u.unit" :value="u.unit">
                        {{ u.unit }} (x{{ u.ratio }})
                      </option>
                    </select>
                    <span v-else class="text-[10px] font-bold text-slate-400">
                      {{ item.unit }}
                    </span>

                    <!-- Quantity Stepper -->
                    <div class="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden">
                      <button
                        type="button"
                        class="px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        @click="decrementQty(item)"
                      >
                        -
                      </button>
                      <input
                        v-model.number="item.quantity"
                        type="number"
                        min="1"
                        class="w-10 text-center text-xs font-bold text-slate-800 border-x border-slate-100 focus:outline-none"
                        @change="validateItemQty(item)"
                      />
                      <button
                        type="button"
                        class="px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        @click="incrementQty(item)"
                      >
                        +
                      </button>
                    </div>

                    <span class="text-[10px] text-slate-400 font-semibold">
                      x {{ formatPrice(item.unitPrice) }}
                    </span>
                  </div>
                </div>

                <div class="text-right">
                  <span class="text-xs font-extrabold text-slate-900">
                    {{ formatPrice(item.quantity * item.unitPrice - (item.discount || 0)) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Billing Summary Details -->
          <div class="border-t border-slate-100 pt-3 space-y-2 text-xs">
            <div class="flex justify-between text-slate-500 font-semibold">
              <span>Tổng tiền hàng (Tạm tính):</span>
              <span class="font-bold text-slate-800">{{ formatPrice(cartSubtotal) }}</span>
            </div>

            <!-- Discount input (POS-06) -->
            <div class="flex items-center justify-between gap-2">
              <span class="text-slate-500 font-semibold">Chiết khấu / Giảm giá:</span>
              <div class="flex items-center gap-1">
                <input
                  v-model.number="currentCart.discountAmount"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
                />
                <span class="text-[10px] text-slate-400 font-bold">đ</span>
              </div>
            </div>

            <div v-if="currentCart.discountAmount > cartSubtotal * 0.2" class="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-semibold">
              ⚠️ Chiết khấu trên 20% yêu cầu nhập lý do duyệt:
              <input
                v-model="currentCart.discountReason"
                type="text"
                placeholder="Nhập lý do chiết khấu đặc biệt..."
                class="w-full mt-1 bg-white border border-amber-300 rounded px-2 py-0.5 text-[10px] text-slate-800"
              />
            </div>

            <div class="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-100 pt-2">
              <span>Khách cần trả:</span>
              <span class="text-base text-[#dc2626]">{{ formatPrice(cartFinalAmount) }}</span>
            </div>

            <!-- Payment Method: Cash vs Transfer -->
            <div class="pt-2">
              <label class="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Hình thức thanh toán</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  :class="[
                    'py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer flex items-center justify-center gap-1.5 transition-all',
                    currentCart.paymentMethod === 'CASH'
                      ? 'border-[#dc2626] bg-red-50 text-[#dc2626]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  ]"
                  @click="currentCart.paymentMethod = 'CASH'"
                >
                  💵 Tiền mặt
                </button>
                <button
                  type="button"
                  :class="[
                    'py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer flex items-center justify-center gap-1.5 transition-all',
                    currentCart.paymentMethod === 'BANK_TRANSFER'
                      ? 'border-[#dc2626] bg-red-50 text-[#dc2626]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  ]"
                  @click="currentCart.paymentMethod = 'BANK_TRANSFER'"
                >
                  💳 Chuyển khoản quầy
                </button>
              </div>
            </div>

            <!-- Cash change calculation -->
            <div v-if="currentCart.paymentMethod === 'CASH'" class="pt-2 space-y-2">
              <div class="flex items-center justify-between gap-2">
                <span class="text-slate-500 font-semibold">Tiền khách đưa:</span>
                <input
                  v-model.number="currentCart.cashGiven"
                  type="number"
                  min="0"
                  class="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-right text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
                />
              </div>

              <!-- Quick cash suggestion buttons -->
              <div class="flex gap-1.5 justify-end flex-wrap">
                <button
                  type="button"
                  class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer"
                  @click="currentCart.cashGiven = cartFinalAmount"
                >
                  Đủ tiền
                </button>
                <button
                  v-for="amt in [50000, 100000, 200000, 500000]"
                  :key="amt"
                  type="button"
                  class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer"
                  @click="currentCart.cashGiven = amt"
                >
                  {{ formatPrice(amt) }}
                </button>
              </div>

              <div class="flex justify-between font-bold text-xs pt-1">
                <span>Tiền thối lại:</span>
                <span :class="cashChange >= 0 ? 'text-emerald-600' : 'text-red-500'">
                  {{ formatPrice(Math.max(0, cashChange)) }}
                </span>
              </div>
            </div>

            <!-- Note Input -->
            <div class="pt-2">
              <input
                v-model="currentCart.note"
                type="text"
                placeholder="Ghi chú đơn hàng (nếu có)..."
                class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
              />
            </div>
          </div>

          <!-- POS Submit Action Buttons -->
          <div class="pt-2 space-y-2">
            <button
              type="button"
              :disabled="submittingOrder || currentCart.items.length === 0"
              class="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              @click="submitPOSOrder(true)"
            >
              <svg v-if="submittingOrder" class="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span>{{ submittingOrder ? 'Đang tạo hóa đơn...' : '⚡ Hoàn tất & In hóa đơn' }}</span>
            </button>

            <button
              type="button"
              :disabled="submittingOrder || currentCart.items.length === 0"
              class="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              @click="submitPOSOrder(false)"
            >
              <span>Hoàn tất (Không in phiếu)</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- VIEW 2: INVOICES HISTORY (LỊCH SỬ HÓA ĐƠN)  -->
    <!-- ========================================== -->
    <div v-else-if="activeMode === 'history'" class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div class="relative w-full sm:w-72">
          <input
            v-model="historySearch"
            type="text"
            placeholder="Tìm theo mã HĐ, tên, SĐT..."
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
            @keydown.enter="fetchHistory"
          />
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors"
            @click="fetchHistory"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      <div v-if="loadingHistory" class="py-12 text-center text-slate-400 text-xs">
        Đang tải lịch sử hóa đơn...
      </div>

      <div v-else-if="historyOrders.length === 0" class="py-12 text-center text-slate-400 text-xs">
        Không tìm thấy hóa đơn POS nào phù hợp.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-200 text-slate-400 uppercase font-extrabold text-[10px]">
              <th class="py-3 px-3">Mã hóa đơn</th>
              <th class="py-3 px-3">Thời gian</th>
              <th class="py-3 px-3">Khách hàng</th>
              <th class="py-3 px-3">Thu ngân</th>
              <th class="py-3 px-3 text-right">Tổng tiền</th>
              <th class="py-3 px-3 text-center">Trạng thái</th>
              <th class="py-3 px-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="ord in historyOrders" :key="ord._id" class="hover:bg-slate-50">
              <td class="py-3 px-3 font-mono font-bold text-slate-900">{{ ord.invoiceCode }}</td>
              <td class="py-3 px-3 text-slate-500">{{ formatDate(ord.createdAt) }}</td>
              <td class="py-3 px-3 font-semibold text-slate-800">
                {{ ord.customerName }}
                <small v-if="ord.customerPhone" class="block text-slate-400 font-mono">{{ ord.customerPhone }}</small>
              </td>
              <td class="py-3 px-3 text-slate-600 font-semibold">{{ ord.cashierName }}</td>
              <td class="py-3 px-3 text-right font-extrabold text-slate-900">{{ formatPrice(ord.finalAmount) }}</td>
              <td class="py-3 px-3 text-center">
                <span
                  :class="[
                    'text-[10px] font-bold px-2 py-0.5 rounded-full inline-block',
                    ord.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                    ord.status === 'PARTIALLY_RETURNED' ? 'bg-amber-50 text-amber-700' :
                    ord.status === 'RETURNED' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                  ]"
                >
                  {{ ord.status === 'COMPLETED' ? 'Hoàn tất' : ord.status === 'PARTIALLY_RETURNED' ? 'Đã trả 1 phần' : ord.status === 'RETURNED' ? 'Đã trả toàn bộ' : 'Đã hủy' }}
                </span>
              </td>
              <td class="py-3 px-3 text-center space-x-2">
                <button
                  type="button"
                  class="text-blue-600 hover:text-blue-800 font-bold text-xs cursor-pointer"
                  @click="previewInvoice(ord)"
                >
                  Xem & In
                </button>
                <button
                  v-if="ord.status !== 'RETURNED' && ord.status !== 'CANCELLED'"
                  type="button"
                  class="text-red-600 hover:text-red-800 font-bold text-xs cursor-pointer"
                  @click="openRefundModal(ord)"
                >
                  Đổi trả
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- VIEW 3: SESSION REPORT (BÁO CÁO CA BÁN)     -->
    <!-- ========================================== -->
    <div v-else-if="activeMode === 'report'" class="space-y-6">
      <div v-if="loadingReport" class="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs">
        Đang tải báo cáo ca bán...
      </div>
      <div v-else-if="sessionReport" class="space-y-6">
        <!-- Stat Cards Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span class="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Tổng doanh thu ca</span>
            <span class="text-xl font-extrabold text-[#dc2626] block mt-1">{{ formatPrice(sessionReport.totalRevenue) }}</span>
            <span class="text-[10px] text-slate-400 mt-0.5 block">Ngày {{ sessionReport.date }}</span>
          </div>
          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span class="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Tiền mặt thu</span>
            <span class="text-xl font-extrabold text-slate-900 block mt-1">{{ formatPrice(sessionReport.cashTotal) }}</span>
            <span class="text-[10px] text-slate-400 mt-0.5 block">Tại két thu ngân</span>
          </div>
          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span class="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Chuyển khoản</span>
            <span class="text-xl font-extrabold text-blue-600 block mt-1">{{ formatPrice(sessionReport.transferTotal) }}</span>
            <span class="text-[10px] text-slate-400 mt-0.5 block">Tài khoản cửa hàng</span>
          </div>
          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span class="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Hóa đơn & Hàng bán</span>
            <span class="text-xl font-extrabold text-emerald-600 block mt-1">{{ sessionReport.totalOrders }} đơn</span>
            <span class="text-[10px] text-slate-400 mt-0.5 block">{{ sessionReport.itemsSoldCount }} sản phẩm đã bán</span>
          </div>
        </div>

        <div v-if="sessionReport.totalRefundedAmount > 0" class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-semibold text-amber-800">
          ⚠️ Trong ca bán này có {{ sessionReport.refundedOrdersCount }} giao dịch trả hàng với tổng số tiền hoàn: {{ formatPrice(sessionReport.totalRefundedAmount) }}.
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL: PRINT INVOICE RECEIPT (POS-04)      -->
    <!-- ========================================== -->
    <div
      v-if="showPrintModal && selectedInvoice"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      @click="showPrintModal = false"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden p-6 space-y-4"
        @click.stop
      >
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Xem phiếu bán hàng</h3>
          <button class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer" @click="showPrintModal = false">✕</button>
        </div>

        <!-- Printable Bill Area -->
        <div id="pos-print-area" class="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/50 text-xs font-mono space-y-3">
          <!-- Header -->
          <div class="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
            <h2 class="text-sm font-extrabold uppercase text-slate-900 font-sans">NHÀ SÁCH TRƯỜNG THÀNH</h2>
            <p class="text-[10px] text-slate-500">Đ/c: 123 Đường Sách, Q. Ninh Kiều, Cần Thơ</p>
            <p class="text-[10px] text-slate-500">Hotline: 0987 654 321</p>
            <h3 class="text-xs font-bold uppercase pt-1 text-slate-800 font-sans">HÓA ĐƠN BÁN LẺ</h3>
          </div>

          <!-- Metadata -->
          <div class="text-[10px] text-slate-600 space-y-0.5 border-b border-dashed border-slate-300 pb-2">
            <div class="flex justify-between">
              <span>Mã HĐ:</span>
              <span class="font-bold text-slate-900">{{ selectedInvoice.invoiceCode }}</span>
            </div>
            <div class="flex justify-between">
              <span>Ngày giờ:</span>
              <span>{{ formatDate(selectedInvoice.createdAt) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Thu ngân:</span>
              <span>{{ selectedInvoice.cashierName }}</span>
            </div>
            <div class="flex justify-between">
              <span>Khách hàng:</span>
              <span>{{ selectedInvoice.customerName }} {{ selectedInvoice.customerPhone ? '(' + selectedInvoice.customerPhone + ')' : '' }}</span>
            </div>
          </div>

          <!-- Items list -->
          <div class="space-y-1.5 border-b border-dashed border-slate-300 pb-2">
            <div
              v-for="it in selectedInvoice.items"
              :key="it.product"
              class="flex justify-between text-[11px]"
            >
              <div class="min-w-0 pr-2">
                <span class="font-bold block truncate">{{ it.name }}</span>
                <span class="text-[9px] text-slate-500">{{ it.quantity }} {{ it.unit }} x {{ formatPrice(it.unitPrice) }}</span>
              </div>
              <span class="font-bold flex-shrink-0">{{ formatPrice(it.lineTotal) }}</span>
            </div>
          </div>

          <!-- Financial summary -->
          <div class="space-y-1 text-[11px]">
            <div class="flex justify-between">
              <span>Tạm tính:</span>
              <span>{{ formatPrice(selectedInvoice.subtotal) }}</span>
            </div>
            <div v-if="selectedInvoice.discountAmount > 0" class="flex justify-between text-red-600">
              <span>Giảm giá:</span>
              <span>-{{ formatPrice(selectedInvoice.discountAmount) }}</span>
            </div>
            <div class="flex justify-between font-extrabold text-sm pt-1 border-t border-slate-300 text-slate-900 font-sans">
              <span>TỔNG THANH TOÁN:</span>
              <span>{{ formatPrice(selectedInvoice.finalAmount) }}</span>
            </div>
            <div class="flex justify-between text-[10px] text-slate-500 pt-1">
              <span>Hình thức:</span>
              <span>{{ selectedInvoice.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản' }}</span>
            </div>
            <div v-if="selectedInvoice.paymentMethod === 'CASH'" class="flex justify-between text-[10px] text-slate-500">
              <span>Tiền khách đưa:</span>
              <span>{{ formatPrice(selectedInvoice.cashGiven || selectedInvoice.finalAmount) }}</span>
            </div>
            <div v-if="selectedInvoice.paymentMethod === 'CASH' && selectedInvoice.changeGiven > 0" class="flex justify-between text-[10px] text-slate-500">
              <span>Tiền thối lại:</span>
              <span>{{ formatPrice(selectedInvoice.changeGiven) }}</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="text-center pt-2 text-[10px] text-slate-400 font-sans">
            <p>Cảm ơn quý khách và hẹn gặp lại!</p>
            <p class="text-[8px] mt-0.5">Website: truong-thanh-bookstore.vercel.app</p>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            @click="showPrintModal = false"
          >
            Đóng
          </button>
          <button
            type="button"
            class="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
            @click="triggerPrintReceipt"
          >
            🖨️ In hóa đơn
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL: REFUND POS ORDER (POS-07)           -->
    <!-- ========================================== -->
    <div
      v-if="showRefundModal && orderToRefund"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      @click="showRefundModal = false"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden p-6 space-y-4"
        @click.stop
      >
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Đổi trả hàng tại quầy</h3>
            <p class="text-[10px] text-slate-400 font-mono">Hóa đơn: {{ orderToRefund.invoiceCode }}</p>
          </div>
          <button class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer" @click="showRefundModal = false">✕</button>
        </div>

        <div class="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          <div
            v-for="it in refundItemsForm"
            :key="it.productId"
            class="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2 text-xs"
          >
            <div class="flex justify-between font-bold text-slate-900">
              <span>{{ it.name }}</span>
              <span>Đã mua: {{ it.maxQty }} {{ it.unit }}</span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[10px] font-bold text-slate-500 block mb-0.5">Số lượng trả</label>
                <input
                  v-model.number="it.quantity"
                  type="number"
                  min="0"
                  :max="it.maxQty"
                  class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold"
                />
              </div>

              <div>
                <label class="text-[10px] font-bold text-slate-500 block mb-0.5">Tình trạng hàng</label>
                <select
                  v-model="it.condition"
                  class="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
                >
                  <option value="GOOD">Còn tốt (Tái nhập kho bán)</option>
                  <option value="DAMAGED">Bị hỏng (Không nhập kho bán)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">Lý do đổi trả (*)</label>
          <input
            v-model="refundReason"
            type="text"
            placeholder="Nhập lý do khách trả hàng (ví dụ: mua nhầm mẫu, sản phẩm lỗi...)"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            @click="showRefundModal = false"
          >
            Hủy
          </button>
          <button
            type="button"
            :disabled="submittingRefund"
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
            @click="submitRefund"
          >
            {{ submittingRefund ? 'Đang hoàn trả...' : 'Xác nhận đổi trả' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useToast } from 'vue-toastification'
import posService from '@/services/pos.service'
import { productService } from '@/services/product.service'

const toast = useToast()

// Active Mode: pos | history | report
const activeMode = ref<'pos' | 'history' | 'report'>('pos')

// Barcode & Search
const barcodeInputRef = ref<HTMLInputElement | null>(null)
const productSearchQuery = ref('')
const searchResults = ref<any[]>([])
const catalogProducts = ref<any[]>([])
const loadingProducts = ref(false)

// Multi-cart Hold tabs (POS-09)
interface CartItem {
  productId: string
  sku: string
  name: string
  unit: string
  conversionRatio: number
  availableUnits: Array<{ unit: string; ratio: number; price?: number }>
  unitPrice: number
  wholesalePrice?: number
  price: number
  discountPrice?: number
  quantity: number
  discount: number
  stock: number
}

interface HeldCart {
  id: string
  name: string
  customerName: string
  customerPhone: string
  customerType: 'RETAIL' | 'WHOLESALE'
  items: CartItem[]
  discountAmount: number
  discountType: 'FIXED' | 'PERCENT'
  discountReason: string
  paymentMethod: 'CASH' | 'BANK_TRANSFER'
  cashGiven: number
  note: string
}

function createEmptyCart(name: string): HeldCart {
  return {
    id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    customerName: 'Khách lẻ tại quầy',
    customerPhone: '',
    customerType: 'RETAIL',
    items: [],
    discountAmount: 0,
    discountType: 'FIXED',
    discountReason: '',
    paymentMethod: 'CASH',
    cashGiven: 0,
    note: '',
  }
}

const heldCarts = ref<HeldCart[]>([createEmptyCart('Đơn 1')])
const activeCartIndex = ref(0)
const currentCart = computed(() => heldCarts.value[activeCartIndex.value] || heldCarts.value[0])

function addNewHeldCart() {
  const nextNum = heldCarts.value.length + 1
  heldCarts.value.push(createEmptyCart(`Đơn ${nextNum}`))
  activeCartIndex.value = heldCarts.value.length - 1
}

function removeHeldCart(idx: number) {
  if (heldCarts.value.length <= 1) return
  heldCarts.value.splice(idx, 1)
  if (activeCartIndex.value >= heldCarts.value.length) {
    activeCartIndex.value = heldCarts.value.length - 1
  }
}

// Financial calculations
const cartSubtotal = computed(() => {
  return currentCart.value.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice - (item.discount || 0))
  }, 0)
})

const cartFinalAmount = computed(() => {
  const sub = cartSubtotal.value
  let disc = currentCart.value.discountAmount || 0
  if (currentCart.value.discountType === 'PERCENT') {
    disc = Math.round((sub * disc) / 100)
  }
  return Math.max(0, sub - disc)
})

const cashChange = computed(() => {
  const given = currentCart.value.cashGiven || 0
  return given - cartFinalAmount.value
})

function formatPrice(val: number | undefined) {
  if (val === undefined || isNaN(val)) return '0 đ'
  return new Intl.NumberFormat('vi-VN').format(val) + ' đ'
}

function formatDate(dateStr: string | Date | undefined) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getItemEffectivePrice(p: any): number {
  if (currentCart.value.customerType === 'WHOLESALE' && p.wholesalePrice && p.wholesalePrice > 0) {
    return p.wholesalePrice
  }
  return p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price
}

function setCustomerType(type: 'RETAIL' | 'WHOLESALE') {
  currentCart.value.customerType = type
  // Update unit prices in cart
  currentCart.value.items.forEach((it) => {
    if (type === 'WHOLESALE' && it.wholesalePrice && it.wholesalePrice > 0) {
      it.unitPrice = it.wholesalePrice * it.conversionRatio
    } else {
      const baseP = it.discountPrice && it.discountPrice > 0 ? it.discountPrice : it.price
      it.unitPrice = baseP * it.conversionRatio
    }
  })
}

// Product search & barcode scanning
let searchDebounceTimer: any = null
function onSearchInput() {
  clearTimeout(searchDebounceTimer)
  const q = productSearchQuery.value.trim()
  if (!q) {
    searchResults.value = []
    return
  }
  searchDebounceTimer = setTimeout(async () => {
    try {
      const res: any = await posService.searchProducts(q)
      searchResults.value = res.data?.data || res.data || []
    } catch {
      searchResults.value = []
    }
  }, 300)
}

async function handleBarcodeEnter() {
  const barcode = productSearchQuery.value.trim()
  if (!barcode) return

  try {
    const res: any = await posService.searchProducts(barcode)
    const matches = res.data?.data || res.data || []
    if (matches.length > 0) {
      // Prioritize exact barcode or SKU match
      const exact = matches.find((m: any) =>
        m.barcode?.toLowerCase() === barcode.toLowerCase() ||
        m.sku?.toLowerCase() === barcode.toLowerCase() ||
        m.unitConversions?.some((c: any) => c.barcode?.toLowerCase() === barcode.toLowerCase())
      ) || matches[0]

      addProductToCart(exact)
      productSearchQuery.value = ''
      searchResults.value = []
    } else {
      toast.warning(`Không tìm thấy sản phẩm với mã vạch: "${barcode}"`)
    }
  } catch {
    toast.error('Lỗi khi tra cứu mã vạch sản phẩm')
  }
}

function addProductToCart(product: any) {
  const existing = currentCart.value.items.find((it) => it.productId === product._id)
  if (existing) {
    if (existing.quantity + 1 > existing.stock) {
      toast.warning(`Sản phẩm "${product.name}" chỉ còn ${existing.stock} trong kho`)
      return
    }
    existing.quantity += 1
  } else {
    if (product.stock <= 0) {
      toast.warning(`Sản phẩm "${product.name}" đã hết hàng trong kho`)
      return
    }

    const baseUnit = product.unit || 'cái'
    const availableUnits = [{ unit: baseUnit, ratio: 1, price: getItemEffectivePrice(product) }]
    if (product.unitConversions && Array.isArray(product.unitConversions)) {
      product.unitConversions.forEach((c: any) => {
        availableUnits.push({
          unit: c.unit,
          ratio: c.ratio,
          price: c.price,
        })
      })
    }

    const effectiveUnitPrice = getItemEffectivePrice(product)

    currentCart.value.items.push({
      productId: product._id,
      sku: product.sku || '',
      name: product.name,
      unit: baseUnit,
      conversionRatio: 1,
      availableUnits,
      unitPrice: effectiveUnitPrice,
      wholesalePrice: product.wholesalePrice,
      price: product.price,
      discountPrice: product.discountPrice,
      quantity: 1,
      discount: 0,
      stock: product.stock,
    })
  }

  // Auto focus back on barcode scanner
  nextTick(() => {
    barcodeInputRef.value?.focus()
  })
}

function onItemUnitChange(item: CartItem) {
  const u = item.availableUnits.find((x) => x.unit === item.unit)
  if (u) {
    item.conversionRatio = u.ratio || 1
    if (u.price && u.price > 0) {
      item.unitPrice = u.price
    } else {
      const base = currentCart.value.customerType === 'WHOLESALE' && item.wholesalePrice && item.wholesalePrice > 0
        ? item.wholesalePrice
        : (item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price)
      item.unitPrice = base * item.conversionRatio
    }
  }
}

function incrementQty(item: CartItem) {
  const baseReq = (item.quantity + 1) * item.conversionRatio
  if (baseReq > item.stock) {
    toast.warning(`Số lượng vượt quá tồn kho khả dụng (${item.stock})`)
    return
  }
  item.quantity += 1
}

function decrementQty(item: CartItem) {
  if (item.quantity > 1) {
    item.quantity -= 1
  }
}

function validateItemQty(item: CartItem) {
  if (!item.quantity || item.quantity < 1) item.quantity = 1
  const baseReq = item.quantity * item.conversionRatio
  if (baseReq > item.stock) {
    toast.warning(`Số lượng vượt quá tồn kho (${item.stock}). Đã điều chỉnh về mức tối đa.`)
    item.quantity = Math.floor(item.stock / item.conversionRatio) || 1
  }
}

function removeCartItem(idx: number) {
  currentCart.value.items.splice(idx, 1)
}

// Order Submission
const submittingOrder = ref(false)
const showPrintModal = ref(false)
const selectedInvoice = ref<any>(null)

async function submitPOSOrder(andPrint: boolean) {
  if (currentCart.value.items.length === 0) {
    toast.warning('Giỏ hàng trống!')
    return
  }

  submittingOrder.value = true
  try {
    const payload = {
      items: currentCart.value.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unit: it.unit,
        conversionRatio: it.conversionRatio,
        discount: it.discount,
      })),
      customerName: currentCart.value.customerName.trim() || undefined,
      customerPhone: currentCart.value.customerPhone.trim() || undefined,
      customerType: currentCart.value.customerType,
      discountAmount: currentCart.value.discountAmount || 0,
      discountType: currentCart.value.discountType,
      discountReason: currentCart.value.discountReason.trim() || undefined,
      cashGiven: currentCart.value.cashGiven || cartFinalAmount.value,
      paymentMethod: currentCart.value.paymentMethod,
      note: currentCart.value.note.trim() || undefined,
      idempotencyKey: `pos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    }

    const res: any = await posService.createOrder(payload)
    const savedOrder = res.data?.data || res.data

    toast.success(`Tạo hóa đơn thành công: ${savedOrder.invoiceCode}!`)

    // Reset this cart
    const cartName = currentCart.value.name
    heldCarts.value[activeCartIndex.value] = createEmptyCart(cartName)

    // Refresh products catalog stock
    loadCatalog()

    if (andPrint) {
      selectedInvoice.value = savedOrder
      showPrintModal.value = true
    }
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message || 'Lỗi khi tạo hóa đơn quầy'
    toast.error(msg)
  } finally {
    submittingOrder.value = false
  }
}

function triggerPrintReceipt() {
  window.print()
}

// History & Invoices view
const historyOrders = ref<any[]>([])
const loadingHistory = ref(false)
const historySearch = ref('')

async function switchToHistory() {
  activeMode.value = 'history'
  await fetchHistory()
}

async function fetchHistory() {
  loadingHistory.value = true
  try {
    const res: any = await posService.getOrders({
      search: historySearch.value.trim() || undefined,
      limit: 20,
    })
    historyOrders.value = res.data?.data || res.data || []
  } catch {
    toast.error('Lỗi khi tải lịch sử hóa đơn')
  } finally {
    loadingHistory.value = false
  }
}

function previewInvoice(ord: any) {
  selectedInvoice.value = ord
  showPrintModal.value = true
}

// Refund modal state
const showRefundModal = ref(false)
const orderToRefund = ref<any>(null)
const refundItemsForm = ref<any[]>([])
const refundReason = ref('')
const submittingRefund = ref(false)

function openRefundModal(ord: any) {
  orderToRefund.value = ord
  refundReason.value = ''
  refundItemsForm.value = ord.items.map((it: any) => ({
    productId: it.product,
    name: it.name,
    unit: it.unit,
    maxQty: it.quantity - (it.returnedQuantity || 0),
    quantity: 0,
    condition: 'GOOD',
  }))
  showRefundModal.value = true
}

async function submitRefund() {
  if (!refundReason.value.trim()) {
    toast.warning('Vui lòng nhập lý do đổi trả hàng')
    return
  }

  const itemsToReturn = refundItemsForm.value.filter((it) => it.quantity > 0)
  if (itemsToReturn.length === 0) {
    toast.warning('Vui lòng nhập số lượng trả cho ít nhất 1 sản phẩm')
    return
  }

  submittingRefund.value = true
  try {
    const payload = {
      items: itemsToReturn.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        condition: it.condition,
      })),
      reason: refundReason.value.trim(),
      idempotencyKey: `rf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    }

    await posService.refundOrder(orderToRefund.value._id, payload)
    toast.success('Xử lý đổi trả hàng và cập nhật kho thành công!')
    showRefundModal.value = false
    await fetchHistory()
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message || 'Lỗi khi xử lý đổi trả'
    toast.error(msg)
  } finally {
    submittingRefund.value = false
  }
}

// Session Report
const sessionReport = ref<any>(null)
const loadingReport = ref(false)

async function loadSessionReport() {
  activeMode.value = 'report'
  loadingReport.value = true
  try {
    const res: any = await posService.getSessionReport()
    sessionReport.value = res.data?.data || res.data
  } catch {
    toast.error('Lỗi khi tải báo cáo ca bán')
  } finally {
    loadingReport.value = false
  }
}

// Load initial catalog
async function loadCatalog() {
  loadingProducts.value = true
  try {
    const res: any = await productService.getAll({
      limit: 24,
      status: 'ACTIVE',
      sort: 'newest',
    })
    catalogProducts.value = res.data?.data || res.data || []
  } catch {
    catalogProducts.value = []
  } finally {
    loadingProducts.value = false
  }
}

onMounted(() => {
  loadCatalog()
  nextTick(() => {
    barcodeInputRef.value?.focus()
  })
})
</script>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  #pos-print-area, #pos-print-area * {
    visibility: visible;
  }
  #pos-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 80mm;
    border: none !important;
    background: transparent !important;
    padding: 0 !important;
  }
}
</style>
