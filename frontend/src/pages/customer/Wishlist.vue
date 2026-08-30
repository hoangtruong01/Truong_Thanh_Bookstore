<template>
  <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[60vh]">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white">
          {{ $t('nav.wishlist') }}
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Danh sách các sản phẩm bạn đã lưu để theo dõi và mua sắm sau này
        </p>
      </div>
      <span v-if="products.length > 0" class="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
        {{ products.length }} sản phẩm
      </span>
    </div>

    <!-- Loading Skeleton -->
    <SkeletonLoader v-if="loading" type="card" :count="4" />

    <!-- Empty State -->
    <EmptyState
      v-else-if="products.length === 0"
      icon="❤️"
      title="Chưa có sản phẩm yêu thích"
      description="Hãy thả tim những sản phẩm bạn thích để lưu lại và tìm kiếm dễ dàng hơn khi cần nhé."
      actionText="Khám phá sản phẩm"
      @action="$router.push('/products')"
    />

    <!-- Products Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      <div v-for="prod in products" :key="prod._id" class="relative group">
        <ProductCard 
          :product="prod" 
          @add-to-cart="handleAddToCart"
        />
        <!-- Quick Action Overlay -->
        <div class="mt-2 flex gap-2">
          <button
            @click="handleMoveToCart(prod)"
            class="flex-1 py-2 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-[#dc2626] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>🛒 Chuyển vào giỏ</span>
          </button>
          <button
            @click="handleRemoveFromWishlist(prod)"
            class="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-xl transition-colors cursor-pointer"
            title="Xóa khỏi yêu thích"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { userService } from '@/services/user.service';
import { useCartStore } from '@/stores/cart';
import ProductCard from '@/components/ProductCard.vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import EmptyState from '@/components/EmptyState.vue';
import type { Product } from '@/types';
import { useToast } from 'vue-toastification';

const router = useRouter();
const cartStore = useCartStore();
const toast = useToast();
const products = ref<Product[]>([]);
const loading = ref(true);

async function fetchWishlist() {
  loading.value = true;
  try {
    const res = await userService.getWishlist();
    const data = res.data?.data || res.data || [];
    products.value = Array.isArray(data) ? data : data.products || [];
  } catch (err) {
    console.error('Failed to fetch wishlist:', err);
  } finally {
    loading.value = false;
  }
}

function handleAddToCart(product: Product) {
  cartStore.addToCart(product, 1);
  toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
}

async function handleMoveToCart(product: Product) {
  try {
    await userService.moveToCart(product._id);
    cartStore.addToCart(product, 1);
    products.value = products.value.filter((p) => p._id !== product._id);
    toast.success(`Đã chuyển "${product.name}" vào giỏ hàng!`);
  } catch (err: any) {
    toast.error('Không thể chuyển sản phẩm vào giỏ hàng');
  }
}

async function handleRemoveFromWishlist(product: Product) {
  try {
    await userService.removeFromWishlist(product._id);
    products.value = products.value.filter((p) => p._id !== product._id);
    toast.info(`Đã bỏ "${product.name}" khỏi danh sách yêu thích`);
  } catch (err: any) {
    toast.error('Không thể xóa khỏi danh sách yêu thích');
  }
}

onMounted(() => {
  fetchWishlist();
});
</script>
