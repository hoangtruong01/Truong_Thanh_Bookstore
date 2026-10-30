<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-extrabold text-slate-900">ERP-02 & ERP-03: Mua hàng & Nhập kho</h2>
        <p class="text-xs text-slate-500 font-medium">
          Quản lý đơn đặt mua hàng (Purchase Order - PO) và lập phiếu nhận hàng nhập kho (Goods Receipt - GR).
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Tabs toggle -->
        <div class="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            class="px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer"
            :class="[activeTab === 'PO' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900']"
            @click="activeTab = 'PO'"
          >
            Đơn đặt mua (PO)
          </button>
          <button
            class="px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer"
            :class="[activeTab === 'GR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900']"
            @click="activeTab = 'GR'"
          >
            Phiếu nhận hàng (GR)
          </button>
        </div>

        <button
          v-if="activeTab === 'PO'"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-[#dc2626] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          @click="openCreatePOModal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Tạo đơn PO</span>
        </button>
      </div>
    </div>

    <!-- TAB 1: PURCHASE ORDERS (ERP-02) -->
    <div v-if="activeTab === 'PO'" class="space-y-4">
      <!-- Filter Bar -->
      <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div class="relative w-full sm:w-80">
          <input
            v-model="poSearch"
            type="text"
            placeholder="Tìm theo mã PO hoặc ghi chú..."
            class="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-red-500"
            @keyup.enter="fetchPOs"
          />
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <select
            v-model="poStatusFilter"
            class="text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
            @change="fetchPOs"
          >
            <option value="">Tất cả trạng thái PO</option>
            <option value="DRAFT">Nháp (DRAFT)</option>
            <option value="APPROVED">Đã duyệt (APPROVED)</option>
            <option value="SENT">Đã gửi NCC (SENT)</option>
            <option value="PARTIALLY_RECEIVED">Nhận một phần</option>
            <option value="FULLY_RECEIVED">Đã nhận đủ</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <button class="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer" @click="fetchPOs">
            Lọc
          </button>
        </div>
      </div>

      <!-- PO Table -->
      <div class="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th class="p-4">Mã PO</th>
                <th class="p-4">Nhà cung cấp</th>
                <th class="p-4 text-center">Tiến độ nhận</th>
                <th class="p-4 text-right">Tổng tiền</th>
                <th class="p-4">Trạng thái</th>
                <th class="p-4">Ngày tạo</th>
                <th class="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="poLoading" class="text-center">
                <td colspan="7" class="p-8 text-slate-400">Đang tải danh sách đơn đặt mua...</td>
              </tr>
              <tr v-else-if="purchaseOrders.length === 0" class="text-center">
                <td colspan="7" class="p-8 text-slate-400">Không tìm thấy đơn đặt mua nào.</td>
              </tr>
              <tr v-for="po in purchaseOrders" :key="po._id" class="hover:bg-slate-50/60 transition-colors">
                <td class="p-4 font-mono font-black text-slate-800">
                  <span class="px-2 py-1 bg-red-50 text-red-700 rounded-md border border-red-100">{{ po.poCode }}</span>
                </td>
                <td class="p-4">
                  <p class="font-extrabold text-slate-900">{{ po.supplier?.name || 'NCC' }}</p>
                  <p class="text-[11px] text-slate-400 font-mono">{{ po.supplier?.code }}</p>
                </td>
                <td class="p-4 text-center">
                  <span class="px-2.5 py-1 bg-slate-100 font-bold rounded-lg text-slate-700">
                    {{ calculatePOProgress(po) }}
                  </span>
                </td>
                <td class="p-4 text-right font-black text-slate-900">
                  {{ formatCurrency(po.totalAmount || 0) }}
                </td>
                <td class="p-4">
                  <span
                    class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border"
                    :class="getPOStatusClass(po.status)"
                  >
                    {{ getPOStatusLabel(po.status) }}
                  </span>
                </td>
                <td class="p-4 text-slate-500">
                  {{ formatDate(po.createdAt) }}
                </td>
                <td class="p-4 text-right space-x-1.5 whitespace-nowrap">
                  <!-- Xem chi tiết -->
                  <button
                    class="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    title="Xem chi tiết"
                    @click="openPODetailModal(po)"
                  >
                    👁️
                  </button>

                  <!-- Duyệt PO (DRAFT) -->
                  <button
                    v-if="po.status === 'DRAFT'"
                    class="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg border border-blue-200 cursor-pointer"
                    @click="handleApprovePO(po)"
                  >
                    Duyệt
                  </button>

                  <!-- Gửi NCC (APPROVED) -->
                  <button
                    v-if="po.status === 'APPROVED'"
                    class="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold rounded-lg border border-purple-200 cursor-pointer"
                    @click="handleSendPO(po)"
                  >
                    Gửi NCC
                  </button>

                  <!-- Nhận hàng (SENT or PARTIALLY_RECEIVED) -->
                  <button
                    v-if="po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED'"
                    class="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-lg shadow-xs cursor-pointer"
                    @click="openReceiveGoodsModal(po)"
                  >
                    Nhận hàng
                  </button>

                  <!-- Hủy PO -->
                  <button
                    v-if="po.status === 'DRAFT' || po.status === 'APPROVED' || po.status === 'SENT'"
                    class="p-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                    title="Hủy đơn"
                    @click="handleCancelPO(po)"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: GOODS RECEIPTS (ERP-03) -->
    <div v-else class="space-y-4">
      <!-- GR Table -->
      <div class="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th class="p-4">Mã Phiếu GR</th>
                <th class="p-4">Đơn PO tham chiếu</th>
                <th class="p-4">Nhà cung cấp</th>
                <th class="p-4 text-center">Mặt hàng nhận</th>
                <th class="p-4 text-right">Tổng giá trị nhận</th>
                <th class="p-4">Người nhận</th>
                <th class="p-4">Ngày nhận</th>
                <th class="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="grLoading" class="text-center">
                <td colspan="8" class="p-8 text-slate-400">Đang tải danh sách phiếu nhận hàng...</td>
              </tr>
              <tr v-else-if="goodsReceipts.length === 0" class="text-center">
                <td colspan="8" class="p-8 text-slate-400">Chưa có phiếu nhận hàng nào.</td>
              </tr>
              <tr v-for="gr in goodsReceipts" :key="gr._id" class="hover:bg-slate-50/60 transition-colors">
                <td class="p-4 font-mono font-black text-slate-800">
                  <span class="px-2 py-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200">{{ gr.receiptCode }}</span>
                </td>
                <td class="p-4 font-mono font-bold text-red-700">
                  {{ gr.purchaseOrder?.poCode || 'PO' }}
                </td>
                <td class="p-4 font-extrabold text-slate-900">
                  {{ gr.supplier?.name || 'NCC' }}
                </td>
                <td class="p-4 text-center">
                  <span class="px-2.5 py-1 bg-slate-100 font-bold rounded-lg text-slate-700">
                    {{ gr.items?.length || 0 }} dòng SP
                  </span>
                </td>
                <td class="p-4 text-right font-black text-emerald-700">
                  {{ formatCurrency(gr.totalAmount || 0) }}
                </td>
                <td class="p-4 text-slate-700">
                  {{ gr.receivedBy?.name || 'Nhân viên' }}
                </td>
                <td class="p-4 text-slate-500">
                  {{ formatDate(gr.receivedAt || gr.createdAt) }}
                </td>
                <td class="p-4 text-right">
                  <button
                    class="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    title="Xem chi tiết"
                    @click="openGRDetailModal(gr)"
                  >
                    👁️ Chi tiết
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL TẠO ĐƠN PO MỚI (ERP-02) -->
    <div v-if="showCreatePOModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="border-b border-slate-100 pb-3 flex justify-between items-center">
          <div>
            <h3 class="text-base font-extrabold text-slate-900">Tạo đơn đặt mua hàng mới (PO)</h3>
            <p class="text-[11px] text-amber-600 font-bold">Lưu ý: Tạo PO chưa làm tăng tồn kho thực tế.</p>
          </div>
          <button class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" @click="showCreatePOModal = false">✕</button>
        </div>

        <form class="space-y-4" @submit.prevent="submitCreatePO">
          <!-- Chọn NCC -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Nhà cung cấp *</label>
              <select
                v-model="newPOData.supplier"
                required
                class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
              >
                <option value="" disabled>-- Chọn nhà cung cấp --</option>
                <option v-for="s in availableSuppliers" :key="s._id" :value="s._id">
                  {{ s.name }} ({{ s.code }})
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Ghi chú đơn đặt mua</label>
              <input
                v-model="newPOData.note"
                type="text"
                placeholder="VD: Đặt hàng bổ sung SGK & văn phòng phẩm"
                class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <!-- Danh sách dòng sản phẩm -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-slate-800 uppercase">Sản phẩm đặt mua</span>
              <button
                type="button"
                class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                @click="addPOLineItem"
              >
                + Thêm sản phẩm
              </button>
            </div>

            <div class="space-y-2">
              <div
                v-for="(item, idx) in newPOData.items"
                :key="idx"
                class="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row gap-2 items-center"
              >
                <div class="flex-1 w-full">
                  <select
                    v-model="item.product"
                    required
                    class="w-full text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white"
                    @change="onProductSelect(item)"
                  >
                    <option value="" disabled>-- Chọn sản phẩm --</option>
                    <option v-for="p in availableProducts" :key="p._id" :value="p._id">
                      {{ p.name }} (SKU: {{ p.sku }} | ĐVT: {{ p.unit }})
                    </option>
                  </select>
                </div>

                <div class="w-24">
                  <input
                    v-model="item.unit"
                    type="text"
                    placeholder="ĐVT"
                    class="w-full text-xs border border-slate-200 rounded-xl px-2 py-1.5 bg-white text-center"
                  />
                </div>

                <div class="w-24">
                  <input
                    v-model.number="item.orderedQuantity"
                    type="number"
                    min="1"
                    required
                    placeholder="SL"
                    class="w-full text-xs border border-slate-200 rounded-xl px-2 py-1.5 bg-white text-center font-bold"
                  />
                </div>

                <div class="w-32">
                  <input
                    v-model.number="item.expectedUnitPrice"
                    type="number"
                    min="0"
                    required
                    placeholder="Đơn giá"
                    class="w-full text-xs border border-slate-200 rounded-xl px-2 py-1.5 bg-white text-right font-bold text-slate-800"
                  />
                </div>

                <button
                  type="button"
                  class="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                  @click="removePOLineItem(idx)"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <!-- Total display -->
          <div class="p-4 bg-slate-50 rounded-2xl flex justify-between items-center text-xs">
            <span class="text-slate-500 font-bold">Tổng tiền dự kiến:</span>
            <span class="text-base font-black text-red-700">{{ formatCurrency(calculateNewPOTotal()) }}</span>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              class="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              @click="showCreatePOModal = false"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="submittingPO"
              class="px-4 py-2 text-xs font-bold text-white bg-[#dc2626] hover:bg-red-700 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {{ submittingPO ? 'Đang tạo...' : 'Tạo đơn đặt mua' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL NHẬN HÀNG VÀ NHẬP KHO (ERP-03) -->
    <div v-if="showReceiveModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="border-b border-slate-100 pb-3 flex justify-between items-center">
          <div>
            <h3 class="text-base font-extrabold text-slate-900">Nhận hàng & Nhập kho từ PO: {{ receivingPO?.poCode }}</h3>
            <p class="text-xs text-slate-500 font-medium">Nhà cung cấp: <strong class="text-slate-800">{{ receivingPO?.supplier?.name }}</strong></p>
          </div>
          <button class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" @click="showReceiveModal = false">✕</button>
        </div>

        <form class="space-y-4" @submit.prevent="submitGoodsReceipt">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Ghi chú phiếu nhận hàng</label>
            <input
              v-model="receiptFormData.note"
              type="text"
              placeholder="VD: Kiểm đếm nguyên vẹn thùng hàng, nhập kho chuẩn"
              class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
            />
          </div>

          <div class="space-y-3">
            <h4 class="text-xs font-black text-slate-700 uppercase">Kiểm đếm thực tế từng dòng sản phẩm</h4>

            <div
              v-for="item in receiptFormData.items"
              :key="item.product"
              class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs"
            >
              <div class="flex justify-between items-center font-bold">
                <span class="text-slate-900">{{ item.productName }} ({{ item.sku }})</span>
                <span class="text-slate-500">Còn chờ nhận: {{ item.remainingBaseQty }} {{ item.unit }}</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                <div>
                  <label class="text-[10px] text-slate-500 font-bold block mb-1">Số lượng nhận thực tế</label>
                  <input
                    v-model.number="item.receivedQuantity"
                    type="number"
                    min="1"
                    required
                    class="w-full text-xs border border-slate-200 rounded-xl px-2 py-1.5 bg-white font-bold text-center"
                  />
                </div>
                <div>
                  <label class="text-[10px] text-slate-500 font-bold block mb-1">Hàng hỏng / lỗi</label>
                  <input
                    v-model.number="item.rejectedQuantity"
                    type="number"
                    min="0"
                    class="w-full text-xs border border-slate-200 rounded-xl px-2 py-1.5 bg-white text-center text-red-600 font-bold"
                  />
                </div>
                <div>
                  <label class="text-[10px] text-slate-500 font-bold block mb-1">Đơn giá mua thực tế (đ)</label>
                  <input
                    v-model.number="item.actualUnitPrice"
                    type="number"
                    min="0"
                    required
                    class="w-full text-xs border border-slate-200 rounded-xl px-2 py-1.5 bg-white text-right font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label class="text-[10px] text-slate-500 font-bold block mb-1">Tình trạng</label>
                  <select
                    v-model="item.condition"
                    class="w-full text-xs border border-slate-200 rounded-xl px-2 py-1.5 bg-white"
                  >
                    <option value="GOOD">Đạt chuẩn (GOOD)</option>
                    <option value="DAMAGED">Hỏng lỗi (DAMAGED)</option>
                    <option value="MIXED">Lẫn lộn (MIXED)</option>
                  </select>
                </div>
              </div>

              <div class="flex justify-between items-center text-[11px] pt-1 text-slate-500">
                <span>Số lượng nhập kho đạt chuẩn: <strong class="text-emerald-700">{{ calculateAcceptedQty(item) }} {{ item.unit }}</strong></span>
                <span>Thành tiền: <strong class="text-slate-800">{{ formatCurrency(item.receivedQuantity * item.actualUnitPrice) }}</strong></span>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              class="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              @click="showReceiveModal = false"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="submittingGR"
              class="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {{ submittingGR ? 'Đang nhập kho...' : 'Xác nhận nhập kho' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL XEM CHI TIẾT ĐƠN PO HOẶC PHIẾU GR -->
    <div v-if="showDetailModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 class="text-base font-extrabold text-slate-900">Chi tiết chứng từ {{ detailData?.poCode || detailData?.receiptCode }}</h3>
          <button class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" @click="showDetailModal = false">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl">
            <div><span class="text-slate-500">Nhà cung cấp:</span> <strong class="text-slate-800">{{ detailData?.supplier?.name }}</strong></div>
            <div><span class="text-slate-500">Tổng tiền:</span> <strong class="text-red-700">{{ formatCurrency(detailData?.totalAmount || 0) }}</strong></div>
            <div><span class="text-slate-500">Ngày tạo:</span> <span class="text-slate-700">{{ formatDate(detailData?.createdAt) }}</span></div>
            <div><span class="text-slate-500">Ghi chú:</span> <span class="text-slate-700">{{ detailData?.note || '—' }}</span></div>
          </div>

          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th class="p-2.5">Sản phẩm</th>
                <th class="p-2.5 text-center">ĐVT</th>
                <th class="p-2.5 text-center">Số lượng</th>
                <th class="p-2.5 text-right">Đơn giá</th>
                <th class="p-2.5 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="it in detailData?.items" :key="it.product?._id || it.product">
                <td class="p-2.5 font-bold text-slate-800">{{ it.productName || it.product?.name }}</td>
                <td class="p-2.5 text-center font-mono">{{ it.unit }}</td>
                <td class="p-2.5 text-center font-bold">
                  {{ it.orderedQuantity || it.receivedQuantity }}
                  <span v-if="it.receivedQuantity !== undefined && it.orderedQuantity !== undefined" class="text-slate-400 font-normal">
                    (đã nhận {{ it.receivedQuantity }})
                  </span>
                </td>
                <td class="p-2.5 text-right font-mono">{{ formatCurrency(it.expectedUnitPrice || it.actualUnitPrice) }}</td>
                <td class="p-2.5 text-right font-black text-slate-900">{{ formatCurrency(it.lineTotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end pt-2">
          <button class="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer" @click="showDetailModal = false">
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { purchaseService } from '@/services/purchase.service'
import { supplierService } from '@/services/supplier.service'
import { productService } from '@/services/product.service'
import { useToast } from 'vue-toastification'

const toast = useToast()

const activeTab = ref<'PO' | 'GR'>('PO')

// PO State
const purchaseOrders = ref<any[]>([])
const poLoading = ref(false)
const poSearch = ref('')
const poStatusFilter = ref('')

// GR State
const goodsReceipts = ref<any[]>([])
const grLoading = ref(false)

// Selectors data
const availableSuppliers = ref<any[]>([])
const availableProducts = ref<any[]>([])

// Modals
const showCreatePOModal = ref(false)
const submittingPO = ref(false)
const newPOData = ref<any>({
  supplier: '',
  items: [],
  note: '',
})

const showReceiveModal = ref(false)
const receivingPO = ref<any>(null)
const submittingGR = ref(false)
const receiptFormData = ref<any>({
  note: '',
  items: [],
})

const showDetailModal = ref(false)
const detailData = ref<any>(null)

async function fetchPOs() {
  poLoading.value = true
  try {
    const res: any = await purchaseService.getPurchaseOrders({
      search: poSearch.value,
      status: poStatusFilter.value || undefined,
    })
    const body = res?.data || res
    purchaseOrders.value = body?.data || []
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Không thể tải danh sách đơn đặt mua')
  } finally {
    poLoading.value = false
  }
}

async function fetchGRs() {
  grLoading.value = true
  try {
    const res: any = await purchaseService.getGoodsReceipts()
    const body = res?.data || res
    goodsReceipts.value = body?.data || []
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Không thể tải danh sách phiếu nhận hàng')
  } finally {
    grLoading.value = false
  }
}

async function loadDropdowns() {
  try {
    const [supRes, prodRes]: any = await Promise.all([
      supplierService.getAll({ limit: 100, status: 'ACTIVE' }),
      productService.getAll({ limit: 100 }),
    ])
    availableSuppliers.value = supRes?.data?.data || supRes?.data || []
    availableProducts.value = prodRes?.data?.data || prodRes?.data || []
  } catch {
    // Non-blocking
  }
}

function openCreatePOModal() {
  newPOData.value = {
    supplier: '',
    items: [
      { product: '', unit: 'cái', orderedQuantity: 10, expectedUnitPrice: 10000 },
    ],
    note: '',
  }
  showCreatePOModal.value = true
}

function addPOLineItem() {
  newPOData.value.items.push({
    product: '',
    unit: 'cái',
    orderedQuantity: 10,
    expectedUnitPrice: 10000,
  })
}

function removePOLineItem(index: number | string) {
  const i = Number(index)
  if (newPOData.value.items.length > 1) {
    newPOData.value.items.splice(i, 1)
  }
}

function onProductSelect(item: any) {
  const prod = availableProducts.value.find((p) => p._id === item.product)
  if (prod) {
    item.unit = prod.unit || 'cái'
    item.expectedUnitPrice = prod.price || 10000
  }
}

function calculateNewPOTotal() {
  return (newPOData.value.items || []).reduce(
    (sum: number, it: any) => sum + (it.orderedQuantity || 0) * (it.expectedUnitPrice || 0),
    0,
  )
}

async function submitCreatePO() {
  submittingPO.value = true
  try {
    await purchaseService.createPurchaseOrder(newPOData.value)
    toast.success('Tạo đơn đặt mua (PO) thành công!')
    showCreatePOModal.value = false
    fetchPOs()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi khi tạo đơn PO')
  } finally {
    submittingPO.value = false
  }
}

async function handleApprovePO(po: any) {
  if (!confirm(`Xác nhận phê duyệt đơn đặt mua "${po.poCode}"?`)) return
  try {
    await purchaseService.approvePurchaseOrder(po._id, { note: 'Duyệt đơn đặt mua' })
    toast.success('Đã duyệt đơn PO!')
    fetchPOs()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Không thể duyệt đơn')
  }
}

async function handleSendPO(po: any) {
  if (!confirm(`Xác nhận chuyển đơn "${po.poCode}" sang trạng thái ĐÃ GỬI NHÀ CUNG CẤP?`)) return
  try {
    await purchaseService.sendPurchaseOrder(po._id, 'Đã gửi qua email/zalo cho NCC')
    toast.success('Đã gửi đơn PO!')
    fetchPOs()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Không thể gửi đơn')
  }
}

async function handleCancelPO(po: any) {
  const reason = prompt('Nhập lý do hủy đơn đặt mua:')
  if (!reason) return
  try {
    await purchaseService.cancelPurchaseOrder(po._id, reason)
    toast.success('Đã hủy đơn PO!')
    fetchPOs()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Không thể hủy đơn')
  }
}

function openReceiveGoodsModal(po: any) {
  receivingPO.value = po
  receiptFormData.value = {
    note: '',
    items: (po.items || []).map((it: any) => {
      const remainingBase = (it.baseQuantity || 0) - (it.receivedQuantity || 0)
      const ratio = it.conversionRatio || 1
      const remainingInUnit = Math.ceil(remainingBase / ratio)
      return {
        product: it.product?._id || it.product,
        productName: it.productName || it.product?.name,
        sku: it.sku || it.product?.sku,
        unit: it.unit,
        conversionRatio: ratio,
        remainingBaseQty: remainingBase,
        receivedQuantity: Math.max(0, remainingInUnit),
        rejectedQuantity: 0,
        condition: 'GOOD',
        actualUnitPrice: it.expectedUnitPrice || 0,
      }
    }),
  }
  showReceiveModal.value = true
}

function calculateAcceptedQty(item: any) {
  const base = (item.receivedQuantity || 0) * (item.conversionRatio || 1)
  return Math.max(0, base - (item.rejectedQuantity || 0))
}

async function submitGoodsReceipt() {
  submittingGR.value = true
  try {
    const payload = {
      purchaseOrder: receivingPO.value._id,
      note: receiptFormData.value.note,
      idempotencyKey: `gr-${receivingPO.value._id}-${Date.now()}`,
      items: receiptFormData.value.items.map((it: any) => ({
        product: it.product,
        unit: it.unit,
        receivedQuantity: it.receivedQuantity,
        rejectedQuantity: it.rejectedQuantity || 0,
        condition: it.condition || 'GOOD',
        actualUnitPrice: it.actualUnitPrice,
      })),
    }

    await purchaseService.createGoodsReceipt(payload)
    toast.success('Nhập kho thành công! Tồn kho và giá vốn đã được cập nhật tự động.')
    showReceiveModal.value = false
    fetchPOs()
    fetchGRs()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi khi nhập kho hàng hóa')
  } finally {
    submittingGR.value = false
  }
}

function openPODetailModal(po: any) {
  detailData.value = po
  showDetailModal.value = true
}

function openGRDetailModal(gr: any) {
  detailData.value = gr
  showDetailModal.value = true
}

function calculatePOProgress(po: any) {
  const items = po.items || []
  if (items.length === 0) return '0%'
  const totalBase = items.reduce((sum: number, it: any) => sum + (it.baseQuantity || 0), 0)
  const receivedBase = items.reduce((sum: number, it: any) => sum + (it.receivedQuantity || 0), 0)
  if (totalBase === 0) return '0%'
  const pct = Math.min(100, Math.round((receivedBase / totalBase) * 100))
  return `${pct}% (${receivedBase}/${totalBase})`
}

function getPOStatusClass(status: string) {
  switch (status) {
    case 'DRAFT':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'APPROVED':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'SENT':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'PARTIALLY_RECEIVED':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'FULLY_RECEIVED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'CANCELLED':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function getPOStatusLabel(status: string) {
  switch (status) {
    case 'DRAFT': return 'Bản nháp'
    case 'APPROVED': return 'Đã duyệt'
    case 'SENT': return 'Đã gửi NCC'
    case 'PARTIALLY_RECEIVED': return 'Nhận một phần'
    case 'FULLY_RECEIVED': return 'Đã nhận đủ'
    case 'CANCELLED': return 'Đã hủy'
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
  fetchPOs()
  fetchGRs()
  loadDropdowns()
})
</script>
