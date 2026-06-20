import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Layouts
import CustomerLayout from '@/layouts/CustomerLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

// Customer Pages
import Home from '@/pages/customer/Home.vue'
import ProductList from '@/pages/customer/ProductList.vue'
import ProductDetail from '@/pages/customer/ProductDetail.vue'
import Cart from '@/pages/customer/Cart.vue'
import Checkout from '@/pages/customer/Checkout.vue'
import Login from '@/pages/customer/Login.vue'
import Register from '@/pages/customer/Register.vue'
import LandingPageDetail from '@/pages/customer/LandingPageDetail.vue'

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard.vue'
import AdminProducts from '@/pages/admin/Products.vue'
import AdminProductForm from '@/pages/admin/ProductForm.vue'
import AdminOrders from '@/pages/admin/Orders.vue'
import AdminInventory from '@/pages/admin/Inventory.vue'
import AdminCustomers from '@/pages/admin/Customers.vue'
import AdminPromotions from '@/pages/admin/Promotions.vue'
import AdminReports from '@/pages/admin/Reports.vue'
import AdminCombos from '@/pages/admin/Combos.vue'
import AdminLandingPages from '@/pages/admin/LandingPages.vue'

const routes = [
  {
    path: '/',
    component: CustomerLayout,
    children: [
      { path: '', name: 'Home', component: Home },
      { path: 'products', name: 'ProductList', component: ProductList },
      { path: 'products/:id', name: 'ProductDetail', component: ProductDetail },
      { path: 'cart', name: 'Cart', component: Cart },
      { path: 'checkout', name: 'Checkout', component: Checkout, meta: { requiresAuth: true } },
      { path: 't/:slug', name: 'LandingPageDetail', component: LandingPageDetail },
    ]
  },
  { path: '/login', name: 'Login', component: Login, meta: { guestOnly: true } },
  { path: '/register', name: 'Register', component: Register, meta: { guestOnly: true } },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdmin: true },
    children: [
      { path: '', redirect: { name: 'AdminDashboard' } },
      { path: 'dashboard', name: 'AdminDashboard', component: AdminDashboard },
      { path: 'products', name: 'AdminProducts', component: AdminProducts },
      { path: 'products/create', name: 'AdminProductCreate', component: AdminProductForm },
      { path: 'products/:id/edit', name: 'AdminProductEdit', component: AdminProductForm },
      { path: 'orders', name: 'AdminOrders', component: AdminOrders },
      { path: 'inventory', name: 'AdminInventory', component: AdminInventory },
      { path: 'combos', name: 'AdminCombos', component: AdminCombos },
      { path: 'customers', name: 'AdminCustomers', component: AdminCustomers },
      { path: 'promotions', name: 'AdminPromotions', component: AdminPromotions },
      { path: 'reports', name: 'AdminReports', component: AdminReports },
      { path: 'landing-pages', name: 'AdminLandingPages', component: AdminLandingPages },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresAdmin && !authStore.isStaff) {
    next({ name: 'Login' })
  } else if (to.meta.guestOnly && authStore.isAuthenticated) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
