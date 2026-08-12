import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Layouts (keep eager since they wrap everything)
import CustomerLayout from '@/layouts/CustomerLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

// Customer Pages - lazy loaded for better performance (PERF-01)
const Home = () => import('@/pages/customer/Home.vue')
const ProductList = () => import('@/pages/customer/ProductList.vue')
const ProductDetail = () => import('@/pages/customer/ProductDetail.vue')
const Cart = () => import('@/pages/customer/Cart.vue')
const Checkout = () => import('@/pages/customer/Checkout.vue')
const Login = () => import('@/pages/customer/Login.vue')
const Register = () => import('@/pages/customer/Register.vue')
const ForgotPassword = () => import('@/pages/customer/ForgotPassword.vue')
const LandingPageDetail = () => import('@/pages/customer/LandingPageDetail.vue')
const DealHot = () => import('@/pages/customer/DealHot.vue')
const MyOrders = () => import('@/pages/customer/MyOrders.vue')
const Info = () => import('@/pages/customer/Info.vue')
const OrderDetail = () => import('@/pages/customer/OrderDetail.vue')
const Addresses = () => import('@/pages/customer/Addresses.vue')
const Wishlist = () => import('@/pages/customer/Wishlist.vue')

// Admin Pages - lazy loaded
const AdminDashboard = () => import('@/pages/admin/Dashboard.vue')
const AdminProducts = () => import('@/pages/admin/Products.vue')
const AdminProductForm = () => import('@/pages/admin/ProductForm.vue')
const AdminOrders = () => import('@/pages/admin/Orders.vue')
const AdminInventory = () => import('@/pages/admin/Inventory.vue')
const AdminCustomers = () => import('@/pages/admin/Customers.vue')
const AdminPromotions = () => import('@/pages/admin/Promotions.vue')
const AdminReports = () => import('@/pages/admin/Reports.vue')
const AdminCombos = () => import('@/pages/admin/Combos.vue')
const AdminLandingPages = () => import('@/pages/admin/LandingPages.vue')
const AdminBanners = () => import('@/pages/admin/Banners.vue')

// 404 Page (UX-04)
const NotFound = () => import('@/pages/NotFound.vue')

const routes = [
  {
    path: '/',
    component: CustomerLayout,
    children: [
      { path: '', name: 'Home', component: Home },
      { path: 'products', name: 'ProductList', component: ProductList },
      { path: 'products/:id', name: 'ProductDetail', component: ProductDetail },
      { path: 'cart', name: 'Cart', component: Cart },
      { path: 'checkout', name: 'Checkout', component: Checkout },
      { path: 'deal-hot', name: 'DealHot', component: DealHot },
      { path: 't/:slug', name: 'LandingPageDetail', component: LandingPageDetail },
      { path: 'info', name: 'Info', component: Info },
      { path: 'my-orders', name: 'MyOrders', component: MyOrders, meta: { requiresAuth: true } },
      { path: 'my-orders/:id', name: 'OrderDetail', component: OrderDetail, meta: { requiresAuth: true } },
      { path: 'addresses', name: 'Addresses', component: Addresses, meta: { requiresAuth: true } },
      { path: 'wishlist', name: 'Wishlist', component: Wishlist, meta: { requiresAuth: true } },
    ]
  },
  {
    path: '/',
    component: AuthLayout,
    children: [
      { path: 'login', name: 'Login', component: Login, meta: { guestOnly: true } },
      { path: 'register', name: 'Register', component: Register, meta: { guestOnly: true } },
      { path: 'forgot-password', name: 'ForgotPassword', component: ForgotPassword, meta: { guestOnly: true } },
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdmin: true },
    children: [
      { path: '', redirect: { name: 'AdminDashboard' } },
      { path: 'dashboard', name: 'AdminDashboard', component: AdminDashboard },
      { path: 'products', name: 'AdminProducts', component: AdminProducts, meta: { permission: 'MANAGE_PRODUCTS' } },
      { path: 'products/create', name: 'AdminProductCreate', component: AdminProductForm, meta: { permission: 'MANAGE_PRODUCTS' } },
      { path: 'products/:id/edit', name: 'AdminProductEdit', component: AdminProductForm, meta: { permission: 'MANAGE_PRODUCTS' } },
      { path: 'orders', name: 'AdminOrders', component: AdminOrders, meta: { permission: 'MANAGE_ORDERS' } },
      { path: 'inventory', name: 'AdminInventory', component: AdminInventory, meta: { permission: 'MANAGE_INVENTORY' } },
      { path: 'combos', name: 'AdminCombos', component: AdminCombos, meta: { permission: 'MANAGE_PRODUCTS' } },
      { path: 'customers', name: 'AdminCustomers', component: AdminCustomers, meta: { permission: 'MANAGE_CUSTOMERS' } },
      { path: 'promotions', name: 'AdminPromotions', component: AdminPromotions, meta: { permission: 'MANAGE_PROMOTIONS' } },
      { path: 'reports', name: 'AdminReports', component: AdminReports, meta: { permission: 'VIEW_REPORTS' } },
      { path: 'landing-pages', name: 'AdminLandingPages', component: AdminLandingPages, meta: { permission: 'MANAGE_LANDING_PAGES' } },
      { path: 'banners', name: 'AdminBanners', component: AdminBanners, meta: { permission: 'MANAGE_BANNERS' } },
    ]
  },
  // UX-04: Proper 404 page instead of silent redirect
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.path === from.path) {
      return {}
    }
    return { top: 0 }
  }
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.matched.some(record => record.meta.requiresAuth) && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (!authStore.isStaff) {
      next({ name: 'Login' })
    } else {
      const user = authStore.user
      if (user && user.role === 'STAFF') {
        const requiredPermission = to.meta.permission as string | undefined
        if (requiredPermission && !(user.permissions || []).includes(requiredPermission)) {
          next({ name: 'AdminDashboard' })
          return
        }
      }
      next()
    }
  } else if (to.meta.guestOnly && authStore.isAuthenticated) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

// FIX-3.1: Dynamic SEO Document Title update on route changes
router.afterEach((to) => {
  const titles: Record<string, string> = {
    Home: 'Trường Thành Stationery — Dụng Cụ Học Tập & Văn Phòng Phẩm Chính Hãng',
    ProductList: 'Danh Sách Sản Phẩm — Trường Thành Stationery',
    ProductDetail: 'Chi Tiết Sản Phẩm — Trường Thành Stationery',
    Cart: 'Giỏ Hàng — Trường Thành Stationery',
    Checkout: 'Thanh Toán — Trường Thành Stationery',
    Login: 'Đăng Nhập — Trường Thành Stationery',
    Register: 'Đăng Ký Tài Khoản — Trường Thành Stationery',
    ForgotPassword: 'Quên Mật Khẩu — Trường Thành Stationery',
    MyOrders: 'Đơn Hàng Của Tôi — Trường Thành Stationery',
    OrderDetail: 'Chi Tiết Đơn Hàng — Trường Thành Stationery',
    Addresses: 'Sổ Địa Chỉ — Trường Thành Stationery',
    Wishlist: 'Danh Sách Yêu Thích — Trường Thành Stationery',
    AdminDashboard: 'Tổng Quan Báo Cáo — Trường Thành Admin',
    AdminProducts: 'Quản Lý Sản Phẩm — Trường Thành Admin',
    AdminOrders: 'Quản Lý Đơn Hàng — Trường Thành Admin',
    AdminInventory: 'Quản Lý Tồn Kho — Trường Thành Admin',
    AdminCustomers: 'Quản Lý Khách Hàng — Trường Thành Admin',
    AdminPromotions: 'Mã Khuyến Mãi — Trường Thành Admin',
    AdminReports: 'Báo Cáo Doanh Thu — Trường Thành Admin',
    NotFound: '404 - Không Tìm Thấy Trang — Trường Thành Stationery',
  }
  const pageTitle = titles[to.name as string] || 'Trường Thành Stationery'
  document.title = pageTitle
})

export default router
