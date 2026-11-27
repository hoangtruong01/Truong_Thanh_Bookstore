<template>
  <div v-if="products.length > 0" class="my-8 space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xl">{{ sectionIcon }}</span>
        <h2 class="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          {{ displayTitle }}
        </h2>
      </div>
      <span class="text-xs font-semibold text-slate-500">
        {{ products.length }} gợi ý
      </span>
    </div>

    <!-- Recommendations Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
      <div
        v-for="item in products"
        :key="item._id"
        class="bg-white rounded-xl border border-slate-100 p-3 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
      >
        <router-link :to="`/product/${item.slug}`" class="block space-y-2">
          <!-- Thumbnail -->
          <div class="aspect-square bg-slate-50 rounded-lg overflow-hidden relative flex items-center justify-center">
            <img
              :src="item.images?.[0] || '/placeholder.png'"
              :alt="item.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <span
              v-if="item.recommendationReason"
              class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs max-w-[90%] truncate"
            >
              {{ item.recommendationReason }}
            </span>
          </div>

          <!-- Title -->
          <h3 class="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed group-hover:text-[#dc2626] transition-colors">
            {{ item.name }}
          </h3>
        </router-link>

        <div class="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between gap-1">
          <div>
            <div class="text-xs font-black text-[#dc2626]">
              {{ formatPrice(item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price) }}
            </div>
            <div
              v-if="item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.price"
              class="text-[10px] text-slate-400 line-through"
            >
              {{ formatPrice(item.price) }}
            </div>
          </div>

          <button
            class="p-1.5 rounded-lg bg-slate-100 hover:bg-[#dc2626] text-slate-700 hover:text-white transition-colors cursor-pointer"
            title="Thêm vào giỏ"
            @click.stop="addToCart(item)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import api from '@/utils/api';
import { useCartStore } from '@/stores/cart';
import { useToast } from 'vue-toastification';

interface RecommendationItem {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
  rating: number;
  sold: number;
  recommendationReason?: string;
}

const props = withDefaults(
  defineProps<{
    productId?: string;
    type?: 'frequently_bought_together' | 'related' | 'personalized';
    title?: string;
    limit?: number;
  }>(),
  {
    type: 'frequently_bought_together',
    limit: 4,
  },
);

const cartStore = useCartStore();
const toast = useToast();
const products = ref<RecommendationItem[]>([]);
const isLoading = ref(false);

const sectionIcon = computed(() => {
  if (props.type === 'frequently_bought_together') return '🛒';
  if (props.type === 'related') return '🔗';
  return '✨';
});

const displayTitle = computed(() => {
  if (props.title) return props.title;
  if (props.type === 'frequently_bought_together') return 'Thường Mua Cùng Nhau';
  if (props.type === 'related') return 'Sản Phẩm Tương Tự';
  return 'Gợi Ý Dành Riêng Cho Bạn';
});

function formatPrice(val: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

async function fetchRecommendations() {
  try {
    isLoading.value = true;
    if (props.type === 'personalized') {
      const res = await api.get('/marketing/recommendations/personalized', {
        params: { limit: props.limit },
      });
      products.value = res.data?.items || [];
    } else if (props.productId) {
      const res = await api.get(`/marketing/recommendations/product/${props.productId}`, {
        params: { limit: props.limit },
      });
      if (props.type === 'frequently_bought_together') {
        products.value = res.data?.frequentlyBoughtTogether || [];
      } else {
        products.value = res.data?.related || [];
      }
    }
  } catch (err) {
    products.value = [];
  } finally {
    isLoading.value = false;
  }
}

function addToCart(item: RecommendationItem) {
  try {
    cartStore.addToCart(item as any, 1);
    toast.success(`Đã thêm "${item.name}" vào giỏ hàng!`);
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Không thể thêm vào giỏ hàng');
  }
}

watch(
  () => [props.productId, props.type],
  () => {
    fetchRecommendations();
  },
);

onMounted(() => {
  fetchRecommendations();
});
</script>
