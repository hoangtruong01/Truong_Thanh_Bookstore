import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast, { type PluginOptions } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

const toastOptions: PluginOptions = {
  position: 'top-right' as any,
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
}

app.use(pinia)
app.use(router)
app.use(Toast, toastOptions)

app.mount('#app')
