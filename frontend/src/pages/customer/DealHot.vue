<template>
  <div class="min-h-screen bg-slate-50/50 pb-20 selection:bg-red-500 selection:text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <!-- Premium Hero Header -->
      <div 
        :style="{
          backgroundImage: `url(${dealHotBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }"
        class="rounded-3xl p-6 md:p-10 text-slate-950 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-100"
      >
        <div class="bg-white/85 backdrop-blur-md border border-white/60 rounded-2xl p-5 md:p-6 space-y-3 z-10 text-left max-w-xl shadow-xs">
          <div>
            <span class="inline-flex items-center gap-1 bg-red-600 text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
              🔥 SIÊU GIẢM GIÁ DUY NHẤT HÔM NAY!
            </span>
          </div>
          <h1 class="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight text-slate-900">
            DEAL SỐC <span class="text-red-600">GIỜ VÀNG</span>
          </h1>
          <p class="text-xs md:text-sm text-slate-700 font-extrabold leading-relaxed">
            Sở hữu ngay các sản phẩm văn phòng phẩm, sách và đồ dùng học tập tốt nhất với mức giá cực sốc! Số lượng có hạn, mua ngay kẻo lỡ!
          </p>
        </div>

        <!-- Timer Card -->
        <div class="bg-slate-900/80 backdrop-blur-md border border-slate-750/30 rounded-3xl p-5 shrink-0 flex flex-col items-center md:items-end gap-2 z-10 w-full md:w-auto">
          <span class="text-[10px] text-white/95 font-extrabold uppercase tracking-wider flex items-center gap-1 select-none">
            ⏰ KẾT THÚC SAU:
          </span>
          <div class="flex items-center gap-2">
            <div class="flex flex-col items-center">
              <div class="bg-white text-slate-900 font-mono font-black text-xl px-3 py-2 rounded-xl shadow-md min-w-[42px] text-center leading-none">
                00
              </div>
              <span class="text-[8px] font-extrabold text-white/80 mt-1 uppercase">Giờ</span>
            </div>
            <span class="font-black text-white text-lg -mt-3">:</span>
            <div class="flex flex-col items-center">
              <div class="bg-white text-slate-900 font-mono font-black text-xl px-3 py-2 rounded-xl shadow-md min-w-[42px] text-center leading-none">
                {{ formatTimerUnit(timerMinutes) }}
              </div>
              <span class="text-[8px] font-extrabold text-white/80 mt-1 uppercase">Phút</span>
            </div>
            <span class="font-black text-white text-lg -mt-3">:</span>
            <div class="flex flex-col items-center">
              <div class="bg-white text-slate-900 font-mono font-black text-xl px-3 py-2 rounded-xl shadow-md min-w-[42px] text-center leading-none">
                {{ formatTimerUnit(timerSeconds) }}
              </div>
              <span class="text-[8px] font-extrabold text-white/80 mt-1 uppercase">Giây</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-xs">
        <div class="text-xs md:text-sm text-slate-500 font-extrabold">
          🔥 Đang có <span class="text-red-600 font-black">{{ dealProducts.length }}</span> sản phẩm chạy Deal Sốc
        </div>
        <router-link to="/products" class="text-xs font-black text-slate-500 hover:text-red-600 transition-colors uppercase tracking-wider">
          Xem tất cả sản phẩm
        </router-link>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div v-for="n in 10" :key="n" class="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 animate-pulse">
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="dealProducts.length === 0" class="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-4">
        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          🔥
        </div>
        <h3 class="text-lg font-black text-slate-800">Không tìm thấy sản phẩm deal hot nào</h3>
        <p class="text-slate-400 text-xs max-w-xs mx-auto">Vui lòng quay lại sau để săn thêm nhiều ưu đãi mới!</p>
      </div>

      <!-- Products Catalog Grid -->
      <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <ProductCard
          v-for="prod in dealProducts"
          :key="prod._id"
          :product="prod"
          @add-to-cart="addToCart"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { productService } from '@/services/product.service';
import { useCartStore } from '@/stores/cart';
import { useToast } from 'vue-toastification';
import ProductCard from '@/components/ProductCard.vue';
import dealHotBg from '@/assets/deal-hot-bg.jpg';

const toast = useToast();
const cartStore = useCartStore();

const loading = ref(true);
const dealProducts = ref<any[]>([]);

// Countdown Timer settings
const timerMinutes = ref(30);
const timerSeconds = ref(0);
let timerInterval: any = null;

function addToCart(product: any) {
  cartStore.addToCart(product, 1);
  toast.success(`Đã thêm "${product.name}" vào giỏ hàng`);
}

onMounted(() => {
  loadDealProducts();
  startTimer();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

async function loadDealProducts() {
  loading.value = true;
  try {
    const res = await productService.getAll({ discounted: true, limit: 100 });
    dealProducts.value = res.data?.data || [];
  } catch (err: any) {
    console.error('Error loading deal products:', err);
    toast.error('Lỗi khi tải danh sách sản phẩm deal hot');
  } finally {
    loading.value = false;
  }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (timerSeconds.value > 0) {
      timerSeconds.value--;
    } else if (timerMinutes.value > 0) {
      timerMinutes.value--;
      timerSeconds.value = 59;
    } else {
      // Reset timer to keep urgency high
      timerMinutes.value = 30;
      timerSeconds.value = 0;
    }
  }, 1000);
}

function formatTimerUnit(val: number): string {
  return val < 10 ? `0${val}` : `${val}`;
}
</script>
