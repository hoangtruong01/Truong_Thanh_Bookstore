<template>
  <div class="space-y-0 pb-0 bg-slate-50/50 overflow-hidden">
    <!-- Category Navigation Bar -->
    <HomeCategoryNav :categories="parentCategories" :loading="loadingCategories" />

    <!-- Section 1: Hero Banner Grid (Fahasa-style) -->
    <HeroBannerGrid :banners="bannerGroups" :loading="loadingBanners" />

    <!-- Section 3: DEAL SỐC GIỜ VÀNG (Flash Sale) (Placed above Categories) -->
    <FlashSaleCarousel :products="discounted" :loading="loadingDiscount" @add-to-cart="addToCart" />

    <!-- Section 4: Horizontal Featured Categories -->
    <FeaturedCategories :categories="parentCategories" :loading="loadingCategories" />

    <!-- Section 6: Best Sellers -->
    <CategoryProductSection
      title="Sản phẩm bán chạy nhất"
      subtitle="Mọi người yêu thích"
      :products="bestSelling"
      :loading="loadingBest"
      view-all-link="/products"
      button-label="Xem Thêm Sản Phẩm"
      @add-to-cart="addToCart"
    />

    <!-- Section 7: New Arrivals -->
    <CategoryProductSection
      title="Hàng mới cập bến"
      subtitle="Bộ sưu tập mới"
      :products="newProducts"
      :loading="loadingNew"
      view-all-link="/products?sort=newest"
      button-label="Khám Phá Bộ Sưu Tập Mới"
      @add-to-cart="addToCart"
    />

    <!-- Section 8: Sách Giáo Khoa -->
    <CategoryProductSection
      title="Sách Giáo Khoa 2026"
      subtitle="Bộ sưu tập nổi bật"
      :products="textbookProducts"
      :loading="loadingTextbook"
      :view-all-link="'/products?category=' + getCategoryIdBySlug('sach-giao-khoa')"
      button-label="Khám Phá Sách Giáo Khoa"
      @add-to-cart="addToCart"
    />

    <!-- Section 9: Sách Tham Khảo -->
    <CategoryProductSection
      title="Sách Tham Khảo"
      subtitle="Bộ sưu tập nổi bật"
      :products="referenceProducts"
      :loading="loadingReference"
      :view-all-link="'/products?category=' + getCategoryIdBySlug('sach-tham-khao')"
      button-label="Khám Phá Sách Tham Khảo"
      @add-to-cart="addToCart"
    />

    <!-- Section 5: Editorial Banner -->
    <EditorialBanner />

    <!-- Section 10: Đồ Chơi -->
    <CategoryProductSection
      title="Đồ Chơi"
      subtitle="Bộ sưu tập nổi bật"
      :products="toyProducts"
      :loading="loadingToy"
      :view-all-link="'/products?category=' + getCategoryIdBySlug('do-choi')"
      button-label="Khám Phá Đồ Chơi"
      @add-to-cart="addToCart"
    />

    <!-- Section 11: Truyện Tranh -->
    <CategoryProductSection
      title="Truyện Tranh"
      subtitle="Bộ sưu tập nổi bật"
      :products="comicProducts"
      :loading="loadingComic"
      :view-all-link="'/products?category=' + getCategoryIdBySlug('truyen-tranh')"
      button-label="Khám Phá Truyện Tranh"
      @add-to-cart="addToCart"
    />

    <!-- Section 12: Combo -->
    <CategoryProductSection
      title="COMBO"
      subtitle="Bộ sưu tập nổi bật"
      :products="comboProducts"
      :loading="loadingCombo"
      :view-all-link="'/products?category=' + getCategoryIdBySlug('combo')"
      button-label="Khám Phá Combo"
      @add-to-cart="addToCart"
    />

    <!-- Section 13: Đồ Lưu Niệm -->
    <CategoryProductSection
      title="Đồ Lưu Niệm"
      subtitle="Bộ sưu tập nổi bật"
      :products="giftProducts"
      :loading="loadingGift"
      :view-all-link="'/products?category=' + getCategoryIdBySlug('do-luu-niem')"
      button-label="Khám Phá Đồ Lưu Niệm"
      @add-to-cart="addToCart"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, type Ref } from "vue";
import { useToast } from "vue-toastification";
import { useCartStore } from "@/stores/cart";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { bannerService } from "@/services/banner.service";
import CategoryProductSection from "@/components/CategoryProductSection.vue";
import HomeCategoryNav from "@/components/customer/home/HomeCategoryNav.vue";
import HeroBannerGrid, { type HomeBanner } from "@/components/customer/home/HeroBannerGrid.vue";
import FlashSaleCarousel from "@/components/customer/home/FlashSaleCarousel.vue";
import FeaturedCategories from "@/components/customer/home/FeaturedCategories.vue";
import EditorialBanner from "@/components/customer/home/EditorialBanner.vue";
import { getCategoryIdBySlug as findCategoryIdBySlug } from "@/components/customer/home/homeCategories";
import { useScrollReveal } from "@/composables/useScrollReveal";
import type { Product, Category } from "@/types";
import { useSeoMeta } from "@/composables/useSeoMeta";
import { useOrganizationSchema } from "@/composables/useStructuredData";

useSeoMeta({
  // SEO-TASK-003 (TECH-07): title trang chủ mô tả rõ ngành hàng thay vì chỉ tên thương hiệu
  title: 'Sách & Văn Phòng Phẩm Chính Hãng',
  description: 'Hệ thống bán lẻ văn phòng phẩm & dụng cụ học tập chính hãng tại Việt Nam. Giảm giá đến 30%, giao hàng toàn quốc, đổi trả 7 ngày.',
});
useOrganizationSchema();

const cartStore = useCartStore();
const toast = useToast();
const { observeNewElements } = useScrollReveal();

// ========== Banner Grid State ==========
const loadingBanners = ref(true);
const bannerGroups = ref<Record<string, HomeBanner[]>>({});

// ========== Categories ==========
const parentCategories = ref<Category[]>([]);
const loadingCategories = ref(true);

const getCategoryIdBySlug = (slug: string) => findCategoryIdBySlug(parentCategories.value, slug);

// ========== Product Sections ==========
const bestSelling = ref<Product[]>([]);
const discounted = ref<Product[]>([]);
const newProducts = ref<Product[]>([]);

const loadingBest = ref(true);
const loadingDiscount = ref(true);
const loadingNew = ref(true);

const textbookProducts = ref<Product[]>([]);
const referenceProducts = ref<Product[]>([]);
const toyProducts = ref<Product[]>([]);
const comicProducts = ref<Product[]>([]);
const comboProducts = ref<Product[]>([]);
const giftProducts = ref<Product[]>([]);

const loadingTextbook = ref(true);
const loadingReference = ref(true);
const loadingToy = ref(true);
const loadingComic = ref(true);
const loadingCombo = ref(true);
const loadingGift = ref(true);

// Watch product lists to trigger scroll reveal observation after they load asynchronously
watch(
  [
    bestSelling,
    newProducts,
    textbookProducts,
    referenceProducts,
    toyProducts,
    comicProducts,
    comboProducts,
    giftProducts,
  ],
  () => {
    setTimeout(() => {
      observeNewElements();
    }, 100);
  },
  { deep: true }
);

onMounted(() => {
  // Fetch banners
  bannerService
    .getActive()
    .then((res: any) => {
      bannerGroups.value = res.data || res || {};
    })
    .catch((err: any) => {
      console.error('Error loading banners', err);
    })
    .finally(() => {
      loadingBanners.value = false;
    });

  categoryService
    .getParents()
    .then(async (catRes) => {
      parentCategories.value = catRes.data;

      const fetchCatProds = async (
        slug: string,
        refVar: Ref<Product[]>,
        loadingVar: Ref<boolean>,
      ) => {
        const cat = parentCategories.value.find((c) => c.slug === slug);
        if (cat) {
          try {
            const res: any = await productService.getAll({
              category: cat._id,
              limit: 10,
            });
            refVar.value = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          } catch (err) {
            console.error(`Error loading products for category ${slug}`, err);
          } finally {
            loadingVar.value = false;
          }
        } else {
          loadingVar.value = false;
        }
      };

      await Promise.all([
        fetchCatProds("sach-giao-khoa", textbookProducts, loadingTextbook),
        fetchCatProds("sach-tham-khao", referenceProducts, loadingReference),
        fetchCatProds("do-choi", toyProducts, loadingToy),
        fetchCatProds("truyen-tranh", comicProducts, loadingComic),
        fetchCatProds("combo", comboProducts, loadingCombo),
        fetchCatProds("do-luu-niem", giftProducts, loadingGift),
      ]);
    })
    .catch((err) => {
      console.error("Error loading parent categories", err);
    })
    .finally(() => {
      loadingCategories.value = false;
    });

  productService
    .getBestSelling(10)
    .then((bestRes: any) => {
      bestSelling.value = Array.isArray(bestRes.data)
        ? bestRes.data
        : bestRes.data?.data || [];
    })
    .catch((err) => {
      console.error("Error loading best sellers", err);
    })
    .finally(() => {
      loadingBest.value = false;
    });

  productService
    .getDiscounted(50)
    .then((discRes: any) => {
      discounted.value = Array.isArray(discRes.data)
        ? discRes.data
        : discRes.data?.data || [];
    })
    .catch((err) => {
      console.error("Error loading discounted products", err);
    })
    .finally(() => {
      loadingDiscount.value = false;
    });

  productService
    .getNew(10)
    .then((newRes: any) => {
      newProducts.value = Array.isArray(newRes.data)
        ? newRes.data
        : newRes.data?.data || [];
    })
    .catch((err: any) => {
      console.error("Error loading new products", err);
    })
    .finally(() => {
      loadingNew.value = false;
    });

  setTimeout(() => {
    observeNewElements();
  }, 350);
});

function addToCart(product: Product) {
  cartStore.addToCart(product, 1);
  toast.success(`Đã thêm "${product.name}" vào giỏ hàng`);
}
</script>
