<template>
  <div class="min-h-screen font-sans antialiased pb-20 selection:bg-red-500 selection:text-white" :style="{ backgroundColor: page.backgroundColor, color: page.textColor }">
    <component :is="'style'" v-if="page.customCss">{{ page.customCss }}</component>

    <div v-if="loading" class="min-h-screen flex flex-col items-center justify-center text-slate-500">
      <div class="animate-spin inline-block w-9 h-9 border-4 border-red-600 border-t-transparent rounded-full mb-4"></div>
      <p class="text-sm font-black uppercase tracking-wider">Đang tải trang ưu đãi đặc biệt...</p>
    </div>

    <div v-else-if="error" class="min-h-screen flex flex-col items-center justify-center text-slate-500 p-6 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 text-red-500 mb-4 animate-bounce">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <h2 class="text-lg font-black text-slate-800">Không tìm thấy hoặc trang đã bị tạm đóng</h2>
      <p class="text-xs text-slate-400 mt-1 max-w-sm">Vui lòng kiểm tra lại đường dẫn hoặc quay lại trang chủ.</p>
      <router-link to="/" class="mt-6 bg-[#dc2626] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md hover:bg-[#b91c1c] transition-colors">
        Quay lại Trang chủ
      </router-link>
    </div>

    <div v-else class="max-w-xl mx-auto px-4 md:px-0">
      <!-- Urgency Banner Badges -->
      <div class="text-center py-3.5 px-4 font-black text-xs tracking-widest uppercase shadow-md my-4 rounded-xl text-white select-none animate-pulse" :style="{ backgroundColor: page.primaryColor }">
        🔥 {{ page.badgeText || 'GIẢM GIÁ DUY NHẤT TRONG HÔM NAY' }} 🔥
      </div>

      <!-- Hero Header Title -->
      <div class="text-center space-y-3 py-4">
        <h1 class="text-2xl md:text-3xl font-black leading-tight uppercase tracking-tight" :style="{ color: page.primaryColor }">
          {{ page.title }}
        </h1>
        <p class="text-xs opacity-90 leading-relaxed font-semibold max-w-md mx-auto">
          {{ page.description }}
        </p>

        <!-- Dynamic Urgency Countdown Clock -->
        <div class="flex justify-center items-center gap-2 py-4">
          <div class="flex flex-col items-center">
            <div class="w-12 h-12 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center font-black text-base text-slate-800">
              00
            </div>
            <span class="text-[9px] font-bold text-slate-400 mt-1">NGÀY</span>
          </div>
          <span class="font-extrabold text-slate-400 -mt-5">:</span>
          <div class="flex flex-col items-center">
            <div class="w-12 h-12 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center font-black text-base text-slate-800">
              00
            </div>
            <span class="text-[9px] font-bold text-slate-400 mt-1">GIỜ</span>
          </div>
          <span class="font-extrabold text-slate-400 -mt-5">:</span>
          <div class="flex flex-col items-center">
            <div class="w-12 h-12 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center font-black text-base text-slate-800">
              {{ formatTimerUnit(timerMinutes) }}
            </div>
            <span class="text-[9px] font-bold text-slate-400 mt-1">PHÚT</span>
          </div>
          <span class="font-extrabold text-slate-400 -mt-5">:</span>
          <div class="flex flex-col items-center">
            <div class="w-12 h-12 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center font-black text-base text-slate-800">
              {{ formatTimerUnit(timerSeconds) }}
            </div>
            <span class="text-[9px] font-bold text-slate-400 mt-1">GIÂY</span>
          </div>
        </div>
      </div>

      <!-- Main Slider Image Gallery -->
      <div v-if="page.images && page.images.length > 0" class="my-4 space-y-3">
        <div class="aspect-video w-full rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-md relative group">
          <!-- Sliding Track -->
          <div 
            class="flex w-full h-full transition-transform duration-500 ease-in-out"
            :style="{ transform: `translateX(-${currentImageIdx * 100}%)` }"
          >
            <div 
              v-for="(img, idx) in page.images" 
              :key="idx" 
              class="w-full h-full flex-shrink-0 flex items-center justify-center bg-white"
            >
              <img :src="img" class="w-full h-full object-contain" />
            </div>
          </div>
          
          <!-- Prev/Next navigation overlay -->
          <button
            v-if="page.images.length > 1"
            @click="prevImage"
            class="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/40 hover:bg-slate-900/60 text-white flex items-center justify-center transition-all cursor-pointer z-10"
          >
            ❮
          </button>
          <button
            v-if="page.images.length > 1"
            @click="nextImage"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/40 hover:bg-slate-900/60 text-white flex items-center justify-center transition-all cursor-pointer z-10"
          >
            ❯
          </button>
        </div>

        <!-- Thumbnails gallery -->
        <div v-if="page.images.length > 1" class="flex justify-center gap-2 overflow-x-auto py-1">
          <button
            v-for="(img, idx) in page.images"
            :key="idx"
            @click="selectImageIdx(Number(idx))"
            class="w-11 h-11 rounded-lg border-2 overflow-hidden flex-shrink-0 cursor-pointer transition-all bg-slate-50"
            :class="currentImageIdx === idx ? '' : 'border-slate-200 opacity-60'"
            :style="{ borderColor: currentImageIdx === idx ? page.primaryColor : '' }"
          >
            <img :src="img" class="w-full h-full object-contain" />
          </button>
        </div>
      </div>

      <!-- Trust Badges Features Row -->
      <div class="grid grid-cols-3 gap-2.5 my-6">
        <div class="bg-white/50 border border-white/60 p-3 rounded-xl flex flex-col items-center text-center shadow-xs">
          <span class="text-lg">🚚</span>
          <span class="text-[9px] font-black text-slate-800 uppercase mt-1 leading-none">Miễn phí ship</span>
        </div>
        <div class="bg-white/50 border border-white/60 p-3 rounded-xl flex flex-col items-center text-center shadow-xs">
          <span class="text-lg">📦</span>
          <span class="text-[9px] font-black text-slate-800 uppercase mt-1 leading-none">Được đồng kiểm</span>
        </div>
        <div class="bg-white/50 border border-white/60 p-3 rounded-xl flex flex-col items-center text-center shadow-xs">
          <span class="text-lg">💎</span>
          <span class="text-[9px] font-black text-slate-800 uppercase mt-1 leading-none">Chất lượng cao</span>
        </div>
      </div>

      <!-- Floating Anchor Button -->
      <div class="fixed bottom-4 left-0 right-0 z-40 max-w-xl mx-auto px-4 pointer-events-none">
        <button
          @click="scrollToForm"
          class="w-full py-4 rounded-2xl text-xs font-black uppercase text-white shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer pointer-events-auto active:scale-98 animate-bounce"
          :style="{ backgroundColor: page.primaryColor }"
        >
          🎁 ĐẶT MUA CHO CON NGAY 🎁
        </button>
      </div>

      <!-- Highlights benefits details checklist -->
      <div v-if="page.benefits && page.benefits.length > 0" class="my-8 space-y-4">
        <h2 class="text-sm font-black uppercase tracking-wider text-center select-none">Ưu điểm vượt trội sản phẩm</h2>
        <div class="space-y-3">
          <div v-for="(b, idx) in page.benefits" :key="idx" class="flex gap-4.5 bg-white border border-slate-200/50 p-4.5 rounded-2xl shadow-xs text-slate-800">
            <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-extrabold" :style="{ backgroundColor: page.primaryColor }">
              ✓
            </div>
            <div class="space-y-0.5">
              <h3 class="text-xs font-black text-slate-800 leading-snug">{{ b.title }}</h3>
              <p class="text-[10px] text-slate-500 leading-relaxed font-medium">{{ b.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Product Images Display (below benefits) -->
      <div v-if="page.images && page.images.length > 0" class="my-8 space-y-4">
        <h2 class="text-sm font-black uppercase tracking-wider text-center select-none">Hình ảnh chi tiết sản phẩm</h2>
        <div class="space-y-3">
          <div v-for="(img, idx) in page.images" :key="idx" class="rounded-2xl overflow-hidden bg-white border border-slate-200/50 shadow-md">
            <img :src="img" class="w-full h-auto object-contain" />
          </div>
        </div>
      </div>

      <!-- Testimonials from Parents section (below product images) -->
      <div v-if="page.testimonials && page.testimonials.length > 0" class="my-8 space-y-4">
        <h2 class="text-sm font-black uppercase tracking-wider text-center select-none">Nhận xét từ khách hàng</h2>
        <div class="grid grid-cols-1 gap-3.5">
          <div v-for="(t, idx) in page.testimonials" :key="idx" class="bg-white border border-slate-200/50 p-4.5 rounded-2xl shadow-xs text-slate-800 space-y-2.5">
            <div class="flex items-center gap-3">
              <img :src="t.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'" class="w-9 h-9 rounded-full object-cover border border-slate-100" />
              <div>
                <h4 class="text-xs font-black text-slate-800 leading-none">{{ t.authorName }}</h4>
                <div class="flex items-center text-amber-400 text-xs mt-1">
                  <span v-for="star in t.rating" :key="star">★</span>
                </div>
              </div>
            </div>
            <p class="text-[10px] text-slate-500 leading-relaxed font-medium">"{{ t.content }}"</p>
          </div>
        </div>
      </div>

      <!-- Combo Packages selection panel -->
      <div v-if="page.packages && page.packages.length > 0" class="my-8 space-y-4">
        <h2 class="text-sm font-black uppercase tracking-wider text-center select-none">Chọn Gói Ưu Đãi Khuyến Mãi</h2>
        <div class="space-y-3">
          <div
            v-for="(pkg, idx) in page.packages"
            :key="idx"
            @click="selectPackage(pkg.name)"
            class="p-4.5 rounded-2xl border-2 bg-white relative flex items-center justify-between cursor-pointer transition-all hover:scale-101 shadow-xs text-slate-800"
            :class="selectedPackage === pkg.name ? 'ring-2' : ''"
            :style="{ borderColor: selectedPackage === pkg.name || pkg.isBestSeller ? page.primaryColor : '#e2e8f0', boxShadow: selectedPackage === pkg.name ? '0 0 0 2px ' + page.primaryColor : 'none' }"
          >
            <!-- Ribbon Badge -->
            <span v-if="pkg.badge" class="absolute -top-2.5 left-4 text-[9px] font-black px-2.5 py-0.5 rounded-full text-white uppercase tracking-wider" :style="{ backgroundColor: page.primaryColor }">
              {{ pkg.badge }}
            </span>

            <div class="flex items-center gap-3">
              <!-- Radio Button styling -->
              <span class="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center flex-shrink-0">
                <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: selectedPackage === pkg.name ? page.primaryColor : 'transparent' }"></span>
              </span>
              <div class="space-y-0.5">
                <span class="text-xs font-black text-slate-800 leading-none">{{ pkg.name }}</span>
                <div class="flex items-center gap-2 text-[10px] font-bold">
                  <span class="text-slate-400 line-through">{{ formatMoney(pkg.originalPrice) }}đ</span>
                  <span class="text-emerald-600">Tiết kiệm {{ Math.round((1 - pkg.price / pkg.originalPrice) * 100) }}%</span>
                </div>
              </div>
            </div>

            <div class="text-right">
              <span class="text-sm font-black block text-slate-900 leading-none">{{ formatMoney(pkg.price) }}đ</span>
              <span class="text-[9px] font-bold text-slate-400 block mt-1 uppercase">MIỄN PHÍ SHIP</span>
            </div>
          </div>
        </div>
      </div>



      <!-- Checkout Order Form -->
      <div ref="orderFormEl" class="my-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-md text-slate-800 space-y-5">
        <div class="text-center space-y-1.5">
          <h3 class="text-sm font-black uppercase tracking-wider text-slate-800">Đặt Hàng Nhanh Chóng</h3>
          <p class="text-[10px] text-slate-400 font-semibold">Vui lòng điền đúng số điện thoại để chúng tôi liên hệ xác nhận đơn hàng.</p>
        </div>

        <form @submit.prevent="handleSubmitOrder" class="space-y-4">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Họ tên của bạn (*)</label>
            <input
              v-model="orderForm.fullName"
              type="text"
              required
              placeholder="Nhập họ và tên..."
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
            />
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Số điện thoại liên hệ (*)</label>
            <input
              v-model="orderForm.phone"
              type="tel"
              required
              placeholder="Nhập số điện thoại..."
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
            />
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Địa chỉ giao hàng đầy đủ (*)</label>
            <input
              v-model="orderForm.address"
              type="text"
              required
              placeholder="Số nhà, tên đường, thôn/xóm, phường/xã, quận/huyện, tỉnh..."
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
            />
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Ghi chú (Tùy chọn)</label>
            <textarea
              v-model="orderForm.note"
              rows="2.5"
              placeholder="Lời nhắn cho shipper hoặc ghi chú giao hàng..."
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
            ></textarea>
          </div>

          <!-- Checkout Package Selector review -->
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div class="space-y-0.5">
              <span class="text-[10px] font-bold text-slate-400 uppercase block">Gói đã chọn</span>
              <span class="text-xs font-black text-slate-800">{{ selectedPackage || 'Chưa chọn gói' }}</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-bold text-slate-400 uppercase block">Tổng thanh toán</span>
              <span class="text-sm font-black text-slate-900" :style="{ color: page.primaryColor }">
                {{ formatMoney(selectedPackagePrice) }}đ
              </span>
            </div>
          </div>

          <button
            type="submit"
            :disabled="submittingOrder"
            class="w-full py-4 rounded-xl text-xs font-black uppercase text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            :style="{ backgroundColor: page.primaryColor }"
          >
            <span v-if="submittingOrder" class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            <span>{{ submittingOrder ? 'Đang gửi thông tin đăng ký...' : 'Xác nhận đặt hàng ngay' }}</span>
          </button>
        </form>

        <div class="border-t border-slate-100 pt-4 flex flex-col items-center justify-center text-[10px] text-slate-400 font-bold space-y-1">
          <span class="flex items-center gap-1.5">🤝 Cam kết giao hàng đúng hẹn</span>
          <span class="flex items-center gap-1.5">🔎 Được kiểm tra và thử hàng trước khi thanh toán COD</span>
        </div>
      </div>
    </div>

    <!-- Premium Checkout Success Modal -->
    <div v-if="showSuccessModal" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-5 border border-slate-200 shadow-xl text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div class="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
          ✓
        </div>
        <div class="space-y-1.5">
          <h3 class="text-sm font-black uppercase text-slate-900">Đăng ký mua hàng thành công!</h3>
          <p class="text-xs text-slate-500 font-semibold leading-relaxed">
            Cảm ơn bạn đã tin tưởng mua sắm tại Trường Thành. Đơn hàng của bạn đã được tiếp nhận thành công.
          </p>
        </div>
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-4.5 text-left text-xs font-semibold text-slate-700 space-y-1.5">
          <div class="flex justify-between">
            <span class="text-slate-400 font-bold">Mã đơn hàng:</span>
            <span class="font-extrabold text-slate-900">{{ createdOrderCode }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400 font-bold">Sản phẩm:</span>
            <span class="font-extrabold text-slate-900 max-w-[200px] truncate">{{ page.title }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400 font-bold">Tổng tiền COD:</span>
            <span class="font-extrabold text-emerald-600">{{ formatMoney(selectedPackagePrice) }}đ</span>
          </div>
        </div>
        <button
          @click="closeSuccessModal"
          class="w-full py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
        >
          Quay lại trang chủ
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { landingPageService } from '@/services/landingPage';
import { useToast } from 'vue-toastification';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const loading = ref(true);
const error = ref(false);
const page = ref<any>({});
const currentImageIdx = ref(0);
const selectedPackage = ref('');
const submittingOrder = ref(false);
const showSuccessModal = ref(false);
const createdOrderCode = ref('');

// Autoplay Slideshow for Landing Page images
let autoplayInterval: any = null;

function startAutoplay() {
  stopAutoplay();
  if (page.value?.images && page.value.images.length > 1) {
    autoplayInterval = setInterval(() => {
      nextImage();
    }, 3500); // transition to next image every 3.5 seconds
  }
}

function stopAutoplay() {
  if (autoplayInterval) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
  }
}

function selectImageIdx(idx: number) {
  currentImageIdx.value = idx;
  startAutoplay();
}

// Fake Scarcity Timer
const timerMinutes = ref(30);
const timerSeconds = ref(0);
let timerInterval: any = null;

const orderForm = ref({
  fullName: '',
  phone: '',
  address: '',
  note: '',
});

const selectedPackagePrice = computed(() => {
  if (!page.value.packages || page.value.packages.length === 0) return page.value.price || 0;
  const pkg = page.value.packages.find((p: any) => p.name === selectedPackage.value);
  return pkg ? pkg.price : page.value.price || 0;
});

onMounted(() => {
  loadLandingPage();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  stopAutoplay();
});

async function loadLandingPage() {
  loading.value = true;
  error.value = false;
  try {
    const slug = route.params.slug as string;
    const pageData = (await landingPageService.getBySlug(slug)) as any;
    const pageObj = pageData.data || pageData;
    page.value = pageObj;
    currentImageIdx.value = 0;

    // Set default package selection
    if (pageObj.packages && pageObj.packages.length > 0) {
      const best = pageObj.packages.find((p: any) => p.isBestSeller);
      selectedPackage.value = best ? best.name : pageObj.packages[0].name;
    }

    // Initialize Timer
    timerMinutes.value = pageObj.countdownMinutes || 30;
    timerSeconds.value = 0;
    startTimer();
    startAutoplay();
  } catch (err: any) {
    error.value = true;
    console.error('Error loading landing page:', err);
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
      // Loop/Reset timer to keep scarcity high
      timerMinutes.value = page.value.countdownMinutes || 30;
      timerSeconds.value = 0;
    }
  }, 1000);
}

function formatTimerUnit(val: number): string {
  return val < 10 ? `0${val}` : `${val}`;
}

function prevImage() {
  if (!page.value.images || page.value.images.length === 0) return;
  currentImageIdx.value = (currentImageIdx.value - 1 + page.value.images.length) % page.value.images.length;
  startAutoplay();
}

function nextImage() {
  if (!page.value.images || page.value.images.length === 0) return;
  currentImageIdx.value = (currentImageIdx.value + 1) % page.value.images.length;
  startAutoplay();
}

function selectPackage(name: string) {
  selectedPackage.value = name;
}

const orderFormEl = ref<HTMLElement | null>(null);
function scrollToForm() {
  if (orderFormEl.value) {
    orderFormEl.value.scrollIntoView({ behavior: 'smooth' });
  }
}

async function handleSubmitOrder() {
  if (!orderForm.value.fullName || !orderForm.value.phone || !orderForm.value.address) {
    toast.warning('Vui lòng nhập đầy đủ thông tin bắt buộc (*).');
    return;
  }

  submittingOrder.value = true;
  try {
    const response = (await landingPageService.submitOrder({
      landingPageId: page.value._id,
      fullName: orderForm.value.fullName,
      phone: orderForm.value.phone,
      address: orderForm.value.address,
      packageName: selectedPackage.value,
      note: orderForm.value.note,
    })) as any;

    createdOrderCode.value = response.orderCode;
    showSuccessModal.value = true;
    toast.success('Đăng ký đặt hàng thành công!');
  } catch (err: any) {
    toast.error('Lỗi khi gửi thông tin đặt hàng: ' + (err.response?.data?.message || err.message));
  } finally {
    submittingOrder.value = false;
  }
}

function closeSuccessModal() {
  showSuccessModal.value = false;
  router.push('/');
}

function formatMoney(value: number | string): string {
  if (!value) return '0';
  const num = Number(value);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
</script>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-right-enter-from {
  transform: translateX(-30px);
  opacity: 0;
}
.slide-right-leave-to {
  transform: translateX(30px);
  opacity: 0;
}
</style>
