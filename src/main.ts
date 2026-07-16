import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import { router } from './router'
import { useAppStore } from './stores/app'
import './styles/global.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount('#app')

const appStore = useAppStore(pinia)
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  appStore.setInstallPrompt(event as BeforeInstallPromptEvent)
})
window.addEventListener('appinstalled', () => appStore.clearInstallPrompt())

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh: () => { appStore.updateAvailable = true },
  onOfflineReady: () => { appStore.offlineReady = true },
  onRegisterError: () => { appStore.serviceWorkerError = '离线功能暂不可用，请检查浏览器设置。' },
})
appStore.setUpdateHandler(updateServiceWorker)
