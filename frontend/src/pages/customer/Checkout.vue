<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-extrabold text-slate-900 mb-8">Thanh toán đơn hàng</h1>

    <div v-if="orderSuccess" class="bg-white border border-slate-200 rounded-3xl p-16 text-center max-w-xl mx-auto space-y-6 shadow-xs">
      <div class="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-10 h-10"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
      </div>
      <div class="space-y-2">
        <h2 class="text-2xl font-extrabold text-slate-800">Đặt hàng thành công!</h2>
        <p class="text-slate-500 text-sm">
          Mã đơn hàng của bạn là <span class="font-mono font-bold text-slate-800">{{ orderCode }}</span>. Chúng tôi sẽ sớm liên hệ xác nhận đơn hàng của bạn.
        </p>
      </div>
      <router-link to="/" class="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-xl transition-colors inline-block text-sm">
        Trở về trang chủ
      </router-link>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Checkout Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Shipping details -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Thông tin giao nhận</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="text-xs font-bold text-slate-700">Họ và tên người nhận</label>
              <input
                v-model="shippingInfo.fullName"
                type="text"
                required
                placeholder="Nguyễn Văn A"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-700">Số điện thoại</label>
              <input
                v-model="shippingInfo.phone"
                type="tel"
                required
                placeholder="09xx xxx xxx"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-700">Địa chỉ Email</label>
              <input
                v-model="shippingInfo.email"
                type="email"
                required
                placeholder="customer@example.com"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="text-xs font-bold text-slate-700">Địa chỉ giao hàng chi tiết</label>
              <input
                v-model="shippingInfo.address"
                type="text"
                required
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="text-xs font-bold text-slate-700">Ghi chú đơn hàng (Tùy chọn)</label>
              <textarea
                v-model="shippingInfo.note"
                rows="3"
                placeholder="Ví dụ: Giao giờ hành chính, gọi điện trước khi giao..."
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
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
              :class="[paymentMethod === method.value ? 'border-blue-600 bg-blue-50/20' : 'border-slate-200']"
            >
              <input
                type="radio"
                v-model="paymentMethod"
                :value="method.value"
                name="payment_method"
                class="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p class="text-sm font-bold text-slate-800">{{ method.label }}</p>
                <p class="text-xs text-slate-500 mt-0.5">{{ method.description }}</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Order Review & Pricing Summary -->
      <div class="space-y-6">
        <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Chi tiết đơn hàng</h3>
          <div class="max-h-60 overflow-y-auto space-y-3 divide-y divide-slate-100">
            <div v-for="item in cartStore.items" :key="item.product._id" class="flex gap-3 pt-3 first:pt-0">
              <div class="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden border border-slate-100 flex-shrink-0">
                <img :src="item.product.images[0] || 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'" class="w-full h-full object-cover" />
              </div>
              <div class="flex-grow min-w-0">
                <p class="text-xs font-bold text-slate-800 truncate">{{ item.product.name }}</p>
                <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Số lượng: {{ item.quantity }}</p>
              </div>
              <span class="text-xs font-bold text-slate-800 whitespace-nowrap">
                {{ formatCurrency((item.product.discountPrice || item.product.price) * item.quantity) }}
              </span>
            </div>
          </div>

          <div class="border-t border-slate-100 pt-4 space-y-3 text-sm font-medium">
            <div class="flex justify-between text-slate-500">
              <span>Tạm tính</span>
              <span class="text-slate-800 font-bold">{{ formatCurrency(cartStore.subtotal) }}</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Phí vận chuyển</span>
              <span class="text-slate-800 font-bold">
                {{ cartStore.shippingFee === 0 ? 'Miễn phí' : formatCurrency(cartStore.shippingFee) }}
              </span>
            </div>
            <div v-if="cartStore.discountAmount > 0" class="flex justify-between text-red-500">
              <span>Giảm giá</span>
              <span class="font-bold">-{{ formatCurrency(cartStore.discountAmount) }}</span>
            </div>
            <div class="border-t border-slate-100 pt-3 flex justify-between text-slate-800">
              <span class="text-base font-extrabold">Tổng thanh toán</span>
              <span class="text-lg font-black text-blue-700">{{ formatCurrency(cartStore.total) }}</span>
            </div>
          </div>

          <button
            @click="placeOrder"
            :disabled="submitting || cartStore.items.length === 0"
            class="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-lg shadow-blue-500/20 disabled:bg-slate-300 disabled:shadow-none"
          >
            {{ submitting ? 'Đang xử lý...' : 'Đặt hàng ngay' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { orderService } from '@/services/order.service'
import { formatCurrency } from '@/utils/helpers'

const cartStore = useCartStore()
const authStore = useAuthStore()
const toast = useToast()
const router = useRouter()

const submitting = ref(false)
const orderSuccess = ref(false)
const orderCode = ref('')

const shippingInfo = reactive({
  fullName: '',
  phone: '',
  email: '',
  address: '',
  note: '',
})

const paymentMethod = ref<'COD' | 'BANK_TRANSFER' | 'EWALLET'>('COD')

const paymentMethods = [
  { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)', description: 'Thanh toán bằng tiền mặt khi shipper giao hàng.' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', description: 'Chuyển khoản qua số tài khoản ngân hàng của cửa hàng.' },
  { value: 'EWALLET', label: 'Thanh toán qua ví điện tử', description: 'Momo, ZaloPay, ShopeePay...' },
]

onMounted(() => {
  if (authStore.isAuthenticated && authStore.user) {
    shippingInfo.fullName = authStore.user.fullName || ''
    shippingInfo.phone = authStore.user.phone || ''
    shippingInfo.email = authStore.user.email || ''
  }
})

async function placeOrder() {
  if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.email || !shippingInfo.address) {
    toast.warning('Vui lòng điền đầy đủ thông tin giao hàng')
    return
  }

  submitting.value = true
  try {
    const items = cartStore.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      price: item.product.discountPrice || item.product.price,
      quantity: item.quantity,
      image: item.product.images[0] || '',
    }))

    const orderData: any = {
      items,
      shippingAddress: shippingInfo.address,
      phone: shippingInfo.phone,
      note: shippingInfo.note || undefined,
      paymentMethod: paymentMethod.value,
      promotionCode: cartStore.appliedPromotion?.code || undefined,
      customerName: shippingInfo.fullName,
      customerEmail: shippingInfo.email,
    }

    let response: any
    if (authStore.isAuthenticated) {
      response = await orderService.createAuthenticated(orderData)
    } else {
      response = await orderService.create(orderData)
    }

    orderCode.value = response.data.orderCode
    orderSuccess.value = true
    cartStore.clearCart()
  } catch (err: any) {
    toast.error(err.message || 'Đặt hàng thất bại. Vui lòng kiểm tra lại tồn kho sản phẩm.')
  } finally {
    submitting.value = false
  }
}
</script>
