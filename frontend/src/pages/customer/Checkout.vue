<template>
  <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-extrabold text-slate-900 mb-8">Thanh toán đơn hàng</h1>

    <!-- 1. Trạng Thái: Đặt Hàng & Thanh Toán Thành Công -->
    <div v-if="orderSuccess" class="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 max-w-2xl mx-auto space-y-6 shadow-xs">
      <div class="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-10 h-10"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
      </div>

      <div class="space-y-2 text-center">
        <h2 class="text-2xl font-extrabold text-slate-800">Đặt hàng thành công!</h2>
        <p class="text-slate-500 text-sm">
          Cảm ơn quý khách đã đặt mua tại Nhà Sách Trường Thành.
        </p>
      </div>

      <!-- Tóm tắt mã đơn và thông tin thanh toán -->
      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
        <div class="flex justify-between items-center pb-3 border-b border-slate-200/80">
          <span class="text-slate-500 font-medium">Mã đơn hàng:</span>
          <div class="flex items-center gap-2">
            <span class="font-mono font-black text-slate-900 text-sm">#{{ orderCode }}</span>
            <button
              type="button"
              class="text-[#dc2626] hover:underline font-bold text-[11px] cursor-pointer"
              @click="copyText(orderCode, 'Mã đơn hàng')"
            >
              Sao chép
            </button>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <span class="text-slate-500 font-medium">Người nhận:</span>
          <span class="font-bold text-slate-800">{{ shippingInfo.fullName }} ({{ shippingInfo.phone }})</span>
        </div>

        <div class="flex justify-between items-center">
          <span class="text-slate-500 font-medium">Địa chỉ giao:</span>
          <span class="font-bold text-slate-800 text-right max-w-[320px] truncate">{{ shippingInfo.address }}</span>
        </div>

        <div class="flex justify-between items-center">
          <span class="text-slate-500 font-medium">Phương thức:</span>
          <span class="font-bold text-slate-800">{{ getSelectedPaymentMethodLabel() }}</span>
        </div>

        <div class="flex justify-between items-center pt-2 border-t border-slate-200/80 text-sm">
          <span class="font-black text-slate-900">Tổng thanh toán:</span>
          <span class="font-black text-[#dc2626] text-base">{{ formatCurrency(lastSubmittedTotal) }}</span>
        </div>
      </div>

      <!-- Hướng dẫn chuyển khoản ngân hàng tự động với VietQR (nếu chọn BANK_TRANSFER) -->
      <div v-if="submittedPaymentMethod === 'BANK_TRANSFER'" class="bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200 rounded-2xl p-6 space-y-4">
        <div class="flex items-center gap-2">
          <span class="text-lg">🏦</span>
          <h3 class="font-extrabold text-amber-900 text-sm uppercase tracking-wide">Hướng dẫn thanh toán chuyển khoản ngân hàng</h3>
        </div>
        <p class="text-xs text-amber-800 leading-relaxed">
          Quý khách vui lòng quét mã VietQR bên dưới hoặc chuyển khoản theo đúng thông tin để hệ thống tự động xác nhận đơn hàng trong vòng 1-3 phút.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-white p-4 rounded-xl border border-amber-200">
          <div class="text-center">
            <img
              :src="`https://img.vietqr.io/image/MB-0345678999-compact2.png?amount=${lastSubmittedTotal}&addInfo=${encodeURIComponent(orderCode)}&accountName=TRUONG%20THANH%20BOOKSTORE`"
              alt="VietQR Mã Đơn Hàng"
              class="w-44 h-44 mx-auto rounded-lg border border-slate-200 p-1 shadow-xs"
            />
            <span class="text-[10.5px] text-slate-400 mt-1 block">Quét QR bằng mọi App Ngân hàng</span>
          </div>

          <div class="space-y-2 text-xs text-slate-700">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Ngân hàng thụ hưởng</span>
              <strong class="text-slate-900">MB Bank (Quân Đội)</strong>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Số tài khoản</span>
              <div class="flex items-center gap-2">
                <strong class="font-mono text-slate-900 text-sm">0345678999</strong>
                <button type="button" class="text-xs font-bold text-red-600 hover:underline" @click="copyText('0345678999', 'Số tài khoản')">Copy</button>
              </div>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Chủ tài khoản</span>
              <strong class="text-slate-900">NHÀ SÁCH TRƯỜNG THÀNH</strong>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Số tiền chuyển</span>
              <div class="flex items-center gap-2">
                <strong class="text-[#dc2626] font-bold text-sm">{{ formatCurrency(lastSubmittedTotal) }}</strong>
                <button type="button" class="text-xs font-bold text-red-600 hover:underline" @click="copyText(lastSubmittedTotal.toString(), 'Số tiền')">Copy</button>
              </div>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Nội dung chuyển khoản (bắt buộc)</span>
              <div class="flex items-center gap-2">
                <strong class="font-mono text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-sm">{{ orderCode }}</strong>
                <button type="button" class="text-xs font-bold text-red-600 hover:underline" @click="copyText(orderCode, 'Nội dung chuyển khoản')">Copy</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Thông báo cho COD -->
      <div v-else-if="submittedPaymentMethod === 'COD'" class="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800 flex items-start gap-3">
        <span class="text-lg mt-0.5">📦</span>
        <div>
          <p class="font-bold text-blue-900">Thanh toán khi nhận hàng (COD)</p>
          <p class="mt-0.5 text-blue-700">Đơn hàng sẽ được đóng gói và giao đến quý khách trong 2 - 4 ngày làm việc. Quý khách vui lòng chuẩn bị số tiền <strong>{{ formatCurrency(lastSubmittedTotal) }}</strong> khi nhận hàng.</p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row justify-center gap-3 pt-2">
        <router-link
          v-if="createdOrderId"
          :to="authStore.isAuthenticated ? `/my-orders/${createdOrderId}` : `/guest-orders/${createdOrderId}`"
          class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-3 px-8 rounded-xl transition-colors inline-block text-sm text-center shadow-md shadow-red-500/20"
        >
          Xem tình trạng đơn hàng
        </router-link>
        <router-link to="/products" class="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-8 rounded-xl transition-colors inline-block text-sm text-center">
          Tiếp tục mua sách
        </router-link>
      </div>
    </div>

    <!-- 2. Trạng Thái: Đặt Hàng Thất Bại -->
    <div v-else-if="orderFailed" class="bg-white border border-red-200 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-6 shadow-xs">
      <div class="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-10 h-10"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
      </div>
      <div class="space-y-2">
        <h2 class="text-2xl font-extrabold text-slate-800">Đặt hàng chưa thành công</h2>
        <p class="text-red-600 font-medium text-sm max-w-md mx-auto">
          {{ orderFailReason || 'Hệ thống không thể xử lý đơn hàng lúc này. Vui lòng kiểm tra lại tồn kho hoặc chọn phương thức thanh toán khác.' }}
        </p>
      </div>
      <div class="flex flex-col sm:flex-row justify-center gap-3">
        <button
          type="button"
          class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-3 px-8 rounded-xl transition-colors text-sm cursor-pointer shadow-md shadow-red-500/20"
          @click="resetOrderError"
        >
          Thử lại thanh toán
        </button>
        <router-link to="/cart" class="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-8 rounded-xl transition-colors text-sm">
          Kiểm tra lại giỏ hàng
        </router-link>
      </div>
    </div>

    <!-- 3. Form Đặt Hàng & Checkout UX Minh Bạch -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Checkout Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Shipping details -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Thông tin giao nhận</h3>
          
          <!-- Address Selection from Address Book -->
          <div v-if="authStore.isAuthenticated && addresses.length > 0" class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 mb-4">
            <label class="text-xs font-bold text-slate-700 block">Chọn nhanh từ Sổ địa chỉ</label>
            <select 
              v-model="selectedAddressId"
              class="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
              @change="onAddressSelectChange"
            >
              <option value="" disabled>-- Chọn địa chỉ --</option>
              <option v-for="addr in addresses" :key="addr._id" :value="addr._id">
                [{{ addr.label }}] {{ addr.recipientName }} - {{ addr.phone }} ({{ addr.detail }}, {{ addr.ward }}, {{ addr.district }}, {{ addr.province }})
              </option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="text-xs font-bold text-slate-700">Họ và tên người nhận</label>
              <input
                v-model="shippingInfo.fullName"
                type="text"
                required
                placeholder="Nguyễn Văn A"
                maxlength="100"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
              />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-700">Số điện thoại</label>
              <input
                v-model="shippingInfo.phone"
                type="tel"
                required
                placeholder="09xx xxx xxx"
                maxlength="10"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
                :class="{ 'border-red-300 ring-1 ring-red-300': shippingInfo.phone && !isPhoneValid }"
                @input="onPhoneInput"
              />
              <p v-if="shippingInfo.phone && !isPhoneValid" class="text-[10px] text-red-500 mt-1 font-medium">
                Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0
              </p>
            </div>
            <div>
              <label class="text-xs font-bold text-slate-700">Địa chỉ Email</label>
              <input
                v-model="shippingInfo.email"
                type="email"
                required
                placeholder="customer@example.com"
                maxlength="100"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="text-xs font-bold text-slate-700">Địa chỉ giao hàng chi tiết</label>
              <input
                v-model="shippingInfo.address"
                type="text"
                required
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                maxlength="200"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="text-xs font-bold text-slate-700">Ghi chú đơn hàng (Tùy chọn)</label>
              <textarea
                v-model="shippingInfo.note"
                rows="3"
                placeholder="Ví dụ: Giao giờ hành chính, gọi điện trước khi giao..."
                maxlength="500"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Payment Method -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Phương thức thanh toán</h3>
          <div class="space-y-3">
            <label
              v-for="method in paymentMethods"
              :key="method.value"
              class="flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition-all hover:bg-slate-50"
              :class="[paymentMethod === method.value ? 'border-[#dc2626] bg-red-50/20' : 'border-slate-200']"
            >
              <input
                v-model="paymentMethod"
                type="radio"
                :value="method.value"
                name="payment_method"
                class="mt-1 text-[#dc2626] focus:ring-[#dc2626] accent-[#dc2626]"
              />
              <div class="flex-grow">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-bold text-slate-800">{{ method.label }}</p>
                  <span v-if="method.tag" class="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">{{ method.tag }}</span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">{{ method.description }}</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Order Review & Transparent Pricing Summary (FE-06) -->
      <div class="space-y-6">
        <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <div class="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Chi tiết sản phẩm</h3>
            <span class="text-xs font-bold text-slate-500">{{ checkoutItems.length }} món</span>
          </div>

          <!-- Realtime Stock Warning Banner (FE-06) -->
          <div v-if="hasStockIssues" class="bg-red-50 border border-red-200 rounded-xl p-3.5 space-y-1">
            <p class="text-xs font-bold text-red-700 flex items-center gap-1.5">
              <span>⚠️</span> Có sản phẩm không đủ tồn kho
            </p>
            <p class="text-[11px] text-red-600 leading-relaxed">
              Một số sách trong giỏ hàng đã hết hoặc không đủ số lượng. Vui lòng bấm điều chỉnh hoặc chọn sản phẩm khác để tiếp tục đặt hàng.
            </p>
          </div>

          <!-- Product Item List with Stock Indicators (FE-06) -->
          <div class="max-h-72 overflow-y-auto space-y-3 divide-y divide-slate-100 pr-1">
            <div
              v-for="item in checkoutItems"
              :key="item.product._id"
              class="pt-3 first:pt-0 space-y-1.5 rounded-xl p-2 transition-colors"
              :class="{
                'bg-red-50/40 border border-red-200': getItemStock(item.product._id) !== null && getItemStock(item.product._id)! <= 0,
                'bg-amber-50/30 border border-amber-200': getItemStock(item.product._id) !== null && getItemStock(item.product._id)! > 0 && getItemStock(item.product._id)! < item.quantity
              }"
            >
              <div class="flex gap-3">
                <div class="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden border border-slate-100 flex-shrink-0">
                  <img :src="item.product.images[0] || 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'" class="w-full h-full object-cover" />
                </div>
                <div class="flex-grow min-w-0">
                  <p class="text-xs font-bold text-slate-800 truncate">{{ item.product.name }}</p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[10.5px] text-slate-500 font-semibold">SL: {{ item.quantity }}</span>

                    <!-- Stock Status Badges -->
                    <span
                      v-if="getItemStock(item.product._id) !== null && getItemStock(item.product._id)! <= 0"
                      class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-red-700"
                    >
                      Hết hàng
                    </span>
                    <span
                      v-else-if="getItemStock(item.product._id) !== null && getItemStock(item.product._id)! < item.quantity"
                      class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800"
                    >
                      Còn {{ getItemStock(item.product._id) }} quyển
                    </span>
                    <span
                      v-else
                      class="text-[10px] font-medium text-green-700 flex items-center gap-1"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> Còn hàng
                    </span>
                  </div>
                </div>
                <span class="text-xs font-bold text-slate-800 whitespace-nowrap">
                  {{ formatCurrency(((item.product.discountPrice != null && item.product.discountPrice > 0) ? item.product.discountPrice : item.product.price) * item.quantity) }}
                </span>
              </div>

              <!-- Quick Auto-Adjust button for insufficient stock -->
              <div
                v-if="getItemStock(item.product._id) !== null && getItemStock(item.product._id)! > 0 && getItemStock(item.product._id)! < item.quantity"
                class="flex justify-between items-center bg-white border border-amber-200 rounded-lg px-2.5 py-1 text-[10.5px]"
              >
                <span class="text-amber-800">Bạn chọn {{ item.quantity }}, kho chỉ còn {{ getItemStock(item.product._id) }}</span>
                <button
                  type="button"
                  class="text-[#dc2626] font-bold hover:underline cursor-pointer"
                  @click="adjustItemQty(item.product._id, getItemStock(item.product._id)!)"
                >
                  Điều chỉnh về {{ getItemStock(item.product._id) }}
                </button>
              </div>

              <p
                v-if="getItemStock(item.product._id) !== null && getItemStock(item.product._id)! <= 0"
                class="text-[10px] text-red-600 font-medium"
              >
                Sản phẩm này tạm thời hết hàng. Vui lòng bỏ chọn trong giỏ hàng.
              </p>
            </div>
          </div>

          <!-- Free Shipping Progress Bar (FE-06 Transparency) -->
          <div class="border-t border-slate-100 pt-4 space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-slate-700">Ưu đãi Freeship toàn quốc:</span>
              <span v-if="isEligibleForFreeShipping" class="font-extrabold text-green-600">Đã đạt Freeship! 🎉</span>
              <span v-else class="font-bold text-slate-500">Đơn từ 299K</span>
            </div>

            <!-- Progress Bar Line -->
            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="isEligibleForFreeShipping ? 'bg-green-500' : 'bg-gradient-to-r from-red-500 to-amber-500'"
                :style="{ width: `${freeShippingProgressPercent}%` }"
              ></div>
            </div>

            <p v-if="isEligibleForFreeShipping" class="text-[10.5px] text-green-700 font-medium">
              Đơn hàng đủ điều kiện miễn phí vận chuyển tiết kiệm 30.000đ.
            </p>
            <p v-else class="text-[10.5px] text-slate-500 font-medium">
              Mua thêm <strong class="text-[#dc2626]">{{ formatCurrency(amountNeededForFreeShipping) }}</strong> để được miễn phí vận chuyển!
            </p>
          </div>

          <!-- Coupon Block on Checkout -->
          <div class="border-t border-slate-100 pt-4 space-y-3">
            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Mã giảm giá (Voucher)</h4>
            
            <div v-if="cartStore.appliedPromotion" class="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
              <div class="text-xs text-green-800 font-medium">
                <p class="font-bold">Đã áp dụng: {{ (cartStore.appliedPromotion as any)?.code }}</p>
                <p>Giảm {{ formatCurrency(cartStore.discountAmount) }}</p>
              </div>
              <button class="text-xs font-bold text-red-600 hover:underline" @click="cartStore.removeCoupon">Gỡ</button>
            </div>
            
            <div v-else class="flex gap-2">
              <input
                v-model="couponCode"
                type="text"
                placeholder="Nhập mã giảm giá..."
                maxlength="30"
                class="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white font-mono uppercase tracking-wider"
              />
              <button 
                type="button"
                :disabled="isApplyingCoupon || !couponCode.trim()" 
                class="bg-slate-950 hover:bg-[#dc2626] text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                @click="handleApplyCoupon"
              >
                <svg v-if="isApplyingCoupon" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ isApplyingCoupon ? 'Đang áp dụng...' : 'Áp dụng' }}</span>
              </button>
            </div>
            <p v-if="cartStore.promoError" class="text-[10px] text-red-500 font-medium mt-1">{{ cartStore.promoError }}</p>

            <!-- Collapsible Suggestive Vouchers list -->
            <div v-if="activePromotions.length > 0" class="mt-2">
              <button 
                class="text-xs font-bold text-[#dc2626] hover:text-[#b91c1c] flex items-center gap-1.5 focus:outline-none cursor-pointer" 
                @click="showVoucherList = !showVoucherList"
              >
                <span>{{ showVoucherList ? 'Ẩn danh sách Voucher' : 'Xem Voucher khả dụng' }}</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke-width="2.5" 
                  stroke="currentColor" 
                  class="w-3.5 h-3.5 transition-transform duration-200"
                  :class="{'rotate-180': showVoucherList}"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              <div v-if="showVoucherList" class="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
                <div 
                  v-for="promo in activePromotions" 
                  :key="promo._id" 
                  class="border border-dashed border-red-200 rounded-xl p-2.5 bg-red-50/10 flex justify-between items-center gap-2 hover:bg-red-50/20 transition-colors"
                >
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="bg-red-100 text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">{{ promo.code }}</span>
                      <span class="text-xs font-extrabold text-slate-800">
                        {{ promo.discountType === 'PERCENT' ? `Giảm ${promo.discountValue}%` : `Giảm ${formatCurrency(promo.discountValue)}` }}
                      </span>
                    </div>
                    <p class="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{{ promo.description }}</p>
                    <p class="text-[9px] text-slate-400 mt-0.5 font-medium">Đơn tối thiểu: {{ formatCurrency(promo.minOrderValue) }}</p>
                  </div>
                  <button 
                    type="button"
                    :disabled="isApplyingCoupon || cartStore.subtotal < promo.minOrderValue"
                    class="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2.5 rounded-lg text-[10px] transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                    @click="applySuggestedCoupon(promo.code)"
                  >
                    <svg v-if="isApplyingCoupon" class="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Dùng</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Loyalty Points Redemption Block -->
          <div v-if="authStore.isAuthenticated && userLoyaltyPoints > 0" class="border-t border-slate-100 pt-4 space-y-3">
            <div class="flex justify-between items-center">
              <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Điểm thưởng tích lũy</span>
              </h4>
              <span class="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Có: {{ userLoyaltyPoints.toLocaleString() }} điểm
              </span>
            </div>

            <div v-if="userLoyaltyPoints < 1000" class="text-[11px] text-slate-400 font-medium">
              Bạn cần tối thiểu 1.000 điểm để quy đổi (hiện có {{ userLoyaltyPoints.toLocaleString() }} điểm).
            </div>

            <div v-else class="space-y-2">
              <div class="flex gap-2">
                <input
                  v-model.number="loyaltyPointsInput"
                  type="number"
                  min="0"
                  :max="maxAllowedPoints"
                  step="100"
                  placeholder="Nhập số điểm muốn tiêu (tối thiểu 1.000)..."
                  class="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-semibold"
                />
                <button
                  type="button"
                  class="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer whitespace-nowrap"
                  @click="applyMaxPoints"
                >
                  Tối đa
                </button>
              </div>
              <p class="text-[10px] text-slate-500">
                1 điểm = 100 VNĐ. Tối đa 20% giá trị đơn (tối đa {{ maxAllowedPoints.toLocaleString() }} điểm = {{ formatCurrency(maxAllowedPoints * 100) }}).
              </p>
              <p v-if="loyaltyError" class="text-[10px] text-red-500 font-medium">{{ loyaltyError }}</p>
            </div>
          </div>

          <!-- Bảng Minh Bạch Chi Phí Đơn Hàng (FE-06 Transparency Table) -->
          <div class="border-t border-slate-100 pt-4 space-y-2.5 text-xs font-medium">
            <div class="flex justify-between text-slate-600">
              <span>Tiền hàng tạm tính</span>
              <span class="text-slate-800 font-bold">{{ formatCurrency(cartStore.subtotal) }}</span>
            </div>

            <div class="flex justify-between text-slate-600 items-center">
              <span>Phí vận chuyển</span>
              <div class="text-right">
                <span v-if="isEligibleForFreeShipping" class="font-bold text-green-600 flex items-center gap-1">
                  <span class="line-through text-slate-400 font-normal">30.000 đ</span>
                  <span>Miễn phí</span>
                </span>
                <span v-else class="text-slate-800 font-bold">
                  {{ formatCurrency(cartStore.shippingFee) }}
                </span>
              </div>
            </div>

            <div v-if="cartStore.discountAmount > 0" class="flex justify-between text-red-600">
              <span class="flex items-center gap-1">
                <span>Voucher giảm giá</span>
                <span class="font-mono font-bold bg-red-50 px-1 py-0.2 rounded border border-red-200 text-[10px]">{{ (cartStore.appliedPromotion as any)?.code }}</span>
              </span>
              <span class="font-bold">-{{ formatCurrency(cartStore.discountAmount) }}</span>
            </div>

            <div v-if="loyaltyDiscountAmount > 0" class="flex justify-between text-amber-600">
              <span>Điểm thưởng ({{ loyaltyPointsToSpend.toLocaleString() }} điểm)</span>
              <span class="font-bold">-{{ formatCurrency(loyaltyDiscountAmount) }}</span>
            </div>

            <div class="border-t border-slate-200 pt-3 flex justify-between items-baseline text-slate-900">
              <div>
                <span class="text-sm font-black block">Tổng thanh toán cuối cùng</span>
                <span class="text-[10px] text-slate-400 font-normal">Đã bao gồm VAT, không phí ẩn</span>
              </div>
              <span class="text-xl font-black text-[#dc2626]">{{ formatCurrency(finalTotal) }}</span>
            </div>
          </div>

          <!-- Button Đặt Hàng kèm Submit-Lock Guard (FE-05 + FE-06) -->
          <button
            type="button"
            :disabled="submitting || isPlacingOrder || checkoutItems.length === 0 || hasStockIssues || (!!shippingInfo.phone && !isPhoneValid)"
            class="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-lg shadow-red-500/20 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
            @click="placeOrder"
          >
            <svg v-if="submitting || isPlacingOrder" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-if="hasStockIssues">Vui lòng xử lý tồn kho</span>
            <span v-else-if="submitting || isPlacingOrder">Đang xử lý đặt hàng...</span>
            <span v-else>Xác nhận đặt hàng</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { orderService } from '@/services/order.service'
import { paymentService } from '@/services/payment.service'
import { addressService } from '@/services/address.service'
import { formatCurrency, getEffectivePrice } from '@/utils/helpers'
import { promotionService } from '@/services/promotion.service'
import type { Promotion, Address } from '@/types'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { useDoubleSubmit } from '@/composables/useDoubleSubmit'

useSeoMeta({
  title: 'Thanh toán đơn hàng',
  description: 'Hoàn tất thanh toán đơn hàng tại Trường Thành Stationery.',
})

const cartStore = useCartStore()
const authStore = useAuthStore()
const toast = useToast()
const { isSubmitting: isPlacingOrder } = useDoubleSubmit({ cooldownMs: 1000 })

const checkoutItems = computed(() => cartStore.items.filter(item => item.selected !== false))

const submitting = ref(false)
const isApplyingCoupon = ref(false)
const orderSuccess = ref(false)
const orderFailed = ref(false)
const orderFailReason = ref('')
const orderCode = ref('')
const couponCode = ref('')
const activePromotions = ref<Promotion[]>([])
const showVoucherList = ref(false)
const createdOrderId = ref('')
const lastSubmittedTotal = ref(0)
const submittedPaymentMethod = ref<'COD' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO'>('COD')

// FE-06: Realtime inventory status verification map
const liveStockMap = ref<Record<string, number>>({})

function getItemStock(productId: string): number | null {
  if (liveStockMap.value[productId] !== undefined) {
    return liveStockMap.value[productId]
  }
  return null
}

const hasStockIssues = computed(() => {
  return checkoutItems.value.some((item) => {
    const stock = getItemStock(item.product._id)
    if (stock === null) return false
    return stock <= 0 || stock < item.quantity
  })
})

function adjustItemQty(productId: string, maxAvailable: number) {
  if (maxAvailable <= 0) {
    cartStore.removeFromCart(productId)
    toast.info('Đã xóa sản phẩm hết hàng khỏi giỏ hàng.')
  } else {
    cartStore.updateQuantity(productId, maxAvailable)
    toast.info(`Đã điều chỉnh số lượng về ${maxAvailable} theo tồn kho khả dụng.`)
  }
}

async function verifyInventoryPreview() {
  if (checkoutItems.value.length === 0) return
  try {
    const previewPayload = {
      items: checkoutItems.value.map(item => ({
        product: item.product._id,
        name: item.product.name,
        price: getEffectivePrice(item.product.price, item.product.discountPrice),
        quantity: item.quantity,
        image: item.product.images?.[0] || '',
      })),
      shippingAddress: shippingInfo.address || 'Hà Nội',
      phone: shippingInfo.phone || '0900000000',
      promotionCode: cartStore.appliedPromotion?.code || undefined,
    }

    const res = await orderService.checkoutPreview(previewPayload)
    const data = res.data?.data || res.data
    if (data?.items && Array.isArray(data.items)) {
      const newMap: Record<string, number> = {}
      for (const item of data.items) {
        newMap[item.product] = typeof item.stock === 'number' ? item.stock : 999
      }
      liveStockMap.value = newMap
    }
  } catch (_err) {
    // silently allow fallback without crashing
  }
}

watch(
  () => checkoutItems.value.map(i => `${i.product._id}:${i.quantity}`).join(','),
  () => {
    verifyInventoryPreview()
  },
  { immediate: true }
)

// FE-06: Free Shipping Threshold and Progress Bar
const FREE_SHIPPING_THRESHOLD = 299000
const isEligibleForFreeShipping = computed(() => cartStore.subtotal >= FREE_SHIPPING_THRESHOLD)
const amountNeededForFreeShipping = computed(() => Math.max(0, FREE_SHIPPING_THRESHOLD - cartStore.subtotal))
const freeShippingProgressPercent = computed(() => {
  if (isEligibleForFreeShipping.value) return 100
  return Math.min(100, Math.max(5, Math.round((cartStore.subtotal / FREE_SHIPPING_THRESHOLD) * 100)))
})

// PRODUCT-01: Loyalty Point Spending
const loyaltyPointsInput = ref<number | null>(null)
const userLoyaltyPoints = computed(() => Number(authStore.user?.loyaltyPoints) || 0)
const maxAllowedPoints = computed(() => {
  const maxBySubtotal = Math.floor((cartStore.subtotal * 0.2) / 100)
  return Math.min(userLoyaltyPoints.value, maxBySubtotal)
})

const loyaltyPointsToSpend = computed(() => {
  const val = Number(loyaltyPointsInput.value) || 0
  if (!Number.isSafeInteger(val) || val < 1000 || val > maxAllowedPoints.value) return 0
  return val
})

const loyaltyDiscountAmount = computed(() => loyaltyPointsToSpend.value * 100)

const loyaltyError = computed(() => {
  const val = Number(loyaltyPointsInput.value) || 0
  if (!val) return ''
  if (!Number.isSafeInteger(val)) return 'Số điểm phải là số nguyên'
  if (val < 1000) return 'Tối thiểu 1.000 điểm để áp dụng giảm giá'
  if (val > userLoyaltyPoints.value) return 'Vượt quá số điểm hiện có của bạn'
  if (val > maxAllowedPoints.value) return `Vượt quá giới hạn 20% giá trị đơn hàng (${maxAllowedPoints.value.toLocaleString()} điểm)`
  return ''
})

function applyMaxPoints() {
  if (maxAllowedPoints.value >= 1000) {
    loyaltyPointsInput.value = maxAllowedPoints.value
  } else {
    toast.info('Đơn hàng hiện tại hoặc số dư điểm chưa đủ mức tối thiểu 1.000 điểm')
  }
}

const finalTotal = computed(() => {
  return Math.max(0, cartStore.total - loyaltyDiscountAmount.value)
})

const shippingInfo = reactive({
  fullName: '',
  phone: '',
  email: '',
  address: '',
  note: '',
})

const addresses = ref<Address[]>([])
const selectedAddressId = ref('')

async function fetchUserAddresses() {
  if (!authStore.isAuthenticated) return
  try {
    addresses.value = await addressService.getAll()
    const def = addresses.value.find(a => a.isDefault)
    if (def) {
      selectedAddressId.value = def._id
      applyAddress(def)
    }
  } catch (err) {
    // optional
  }
}

function applyAddress(addr: Address) {
  shippingInfo.fullName = addr.recipientName
  shippingInfo.phone = addr.phone
  shippingInfo.address = `${addr.detail}, ${addr.ward}, ${addr.district}, ${addr.province}`
}

function onAddressSelectChange() {
  const addr = addresses.value.find(a => a._id === selectedAddressId.value)
  if (addr) {
    applyAddress(addr)
  }
}

const paymentMethod = ref<'COD' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO'>('COD')

const paymentMethods = computed(() => [
  {
    value: 'COD',
    label: 'Thanh toán khi nhận hàng (COD)',
    description: 'Thanh toán bằng tiền mặt khi shipper giao hàng tận nơi.',
    tag: 'Phổ biến',
  },
  ...(authStore.isAuthenticated ? [
    {
      value: 'BANK_TRANSFER',
      label: 'Chuyển khoản ngân hàng (VietQR)',
      description: 'Quét mã VietQR chuyển tiền tự động, duyệt đơn nhanh 24/7.',
      tag: 'Khuyên dùng',
    },
    {
      value: 'VNPAY',
      label: 'Cổng thanh toán VNPay',
      description: 'Thanh toán an toàn qua VNPAY-QR, thẻ ATM nội địa hoặc thẻ quốc tế.',
    },
    {
      value: 'MOMO',
      label: 'Ví điện tử MoMo',
      description: 'Quét mã qua ứng dụng MoMo chỉ với 1 chạm.',
    },
  ] : []),
])

function getSelectedPaymentMethodLabel(): string {
  const found = paymentMethods.value.find(m => m.value === submittedPaymentMethod.value)
  return found ? found.label : submittedPaymentMethod.value
}

function copyText(text: string, label: string) {
  navigator.clipboard.writeText(text)
  toast.success(`Đã sao chép ${label}!`)
}

function resetOrderError() {
  orderFailed.value = false
  orderFailReason.value = ''
}

const checkoutIdempotencyKey =
  sessionStorage.getItem('checkout-idempotency-key') || crypto.randomUUID()
sessionStorage.setItem('checkout-idempotency-key', checkoutIdempotencyKey)

// UX-06: Phone validation
const isPhoneValid = computed(() => {
  if (!shippingInfo.phone) return true
  return /^0\d{9}$/.test(shippingInfo.phone)
})

function onPhoneInput(e: Event) {
  const input = e.target as HTMLInputElement
  input.value = input.value.replace(/\D/g, '')
  shippingInfo.phone = input.value
}

async function handleApplyCoupon() {
  if (isApplyingCoupon.value || !couponCode.value.trim()) return
  isApplyingCoupon.value = true
  try {
    const success = await cartStore.applyCoupon(couponCode.value.trim().toUpperCase())
    if (success) {
      toast.success('Áp dụng mã giảm giá thành công!')
      couponCode.value = ''
      await verifyInventoryPreview()
    } else {
      toast.error(cartStore.promoError || 'Mã giảm giá không hợp lệ')
    }
  } finally {
    isApplyingCoupon.value = false
  }
}

async function applySuggestedCoupon(code: string) {
  if (isApplyingCoupon.value) return
  isApplyingCoupon.value = true
  try {
    const success = await cartStore.applyCoupon(code)
    if (success) {
      toast.success('Áp dụng mã giảm giá thành công!')
      await verifyInventoryPreview()
    } else {
      toast.error(cartStore.promoError || 'Mã giảm giá không hợp lệ')
    }
  } finally {
    isApplyingCoupon.value = false
  }
}

onMounted(async () => {
  if (authStore.isAuthenticated && authStore.user) {
    shippingInfo.fullName = authStore.user.fullName || ''
    shippingInfo.phone = authStore.user.phone || ''
    shippingInfo.email = authStore.user.email || ''
    await fetchUserAddresses()
  }

  try {
    const res = await promotionService.getActive()
    activePromotions.value = res.data || []
  } catch (err) {
    // optional
  }

  await verifyInventoryPreview()
})

async function placeOrder() {
  if (submitting.value || isPlacingOrder.value) return
  if (hasStockIssues.value) {
    toast.error('Vui lòng điều chỉnh số lượng hoặc bỏ chọn sản phẩm hết hàng trước khi đặt.')
    return
  }
  if (loyaltyError.value) {
    toast.warning(loyaltyError.value)
    return
  }
  if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.email || !shippingInfo.address) {
    toast.warning('Vui lòng điền đầy đủ thông tin giao hàng')
    return
  }

  submitting.value = true
  orderFailed.value = false
  orderFailReason.value = ''

  try {
    const items = checkoutItems.value.map(item => ({
      product: item.product._id,
      name: item.product.name,
      price: getEffectivePrice(item.product.price, item.product.discountPrice),
      quantity: item.quantity,
      image: item.product.images?.[0] || '',
    }))

    const orderData: any = {
      items,
      shippingAddress: shippingInfo.address,
      phone: shippingInfo.phone,
      note: shippingInfo.note || undefined,
      paymentMethod: paymentMethod.value,
      promotionCode: cartStore.appliedPromotion?.code || undefined,
      loyaltyPointsUsed: loyaltyPointsToSpend.value > 0 ? loyaltyPointsToSpend.value : undefined,
      customerName: shippingInfo.fullName,
      customerEmail: shippingInfo.email,
      idempotencyKey: checkoutIdempotencyKey,
    }

    // Pre-checkout safe validation
    const previewRes = await orderService.checkoutPreview(orderData)
    const previewData = previewRes.data?.data || previewRes.data
    if (previewData && previewData.warnings && previewData.warnings.length > 0) {
      if (!previewData.isValidForCheckout) {
        toast.warning(previewData.warnings.join(' | '))
        submitting.value = false
        return
      }
    }

    let response: any
    if (authStore.isAuthenticated) {
      response = await orderService.createAuthenticated(orderData)
    } else {
      response = await orderService.create(orderData)
    }

    const orderResponseData = response.data.data || response.data
    orderCode.value = orderResponseData.orderCode
    const orderId = orderResponseData._id
    createdOrderId.value = orderId
    lastSubmittedTotal.value = finalTotal.value
    submittedPaymentMethod.value = paymentMethod.value

    const guestToken = orderResponseData.guestAccessToken
    if (!authStore.isAuthenticated && guestToken) {
      localStorage.setItem(`guest-order-token:${orderId}`, guestToken)
    }

    // Process Gateway Redirect if online payment
    if (authStore.isAuthenticated && (paymentMethod.value === 'VNPAY' || paymentMethod.value === 'MOMO')) {
      const paymentRes: any = await paymentService.create(
        orderId,
        paymentMethod.value,
        `${window.location.origin}/my-orders/${orderId}`,
      )
      const action = paymentRes.data?.data?.action || paymentRes.data?.action
      if (action?.instructions) toast.info(action.instructions, { timeout: 12000 })
      if (action?.redirectUrl) {
        window.location.assign(action.redirectUrl)
        return
      }
    }

    sessionStorage.removeItem('checkout-idempotency-key')
    orderSuccess.value = true
    cartStore.clearCheckedOutItems()
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || err.message || 'Đặt hàng thất bại. Vui lòng kiểm tra lại tồn kho sản phẩm.'
    orderFailed.value = true
    orderFailReason.value = errorMsg
    toast.error(errorMsg)
  } finally {
    submitting.value = false
  }
}
</script>
