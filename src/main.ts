import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import { router } from './router'
import { useAppStore } from './stores/app'
import { i18n, locale, t } from './i18n'
import './styles/global.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(i18n)
app.mount('#app')

const appStore = useAppStore(pinia)
document.documentElement.lang = locale.value
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  appStore.setInstallPrompt(event as BeforeInstallPromptEvent)
})
window.addEventListener('appinstalled', () => appStore.clearInstallPrompt())
window.addEventListener('online', () => appStore.setOffline(false))
window.addEventListener('offline', () => appStore.setOffline(true))

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh: () => { appStore.updateAvailable = true },
  onOfflineReady: () => { appStore.offlineReady = true },
  onRegisterError: () => { appStore.serviceWorkerError = t('error.offlineUnavailable') },
})
appStore.setUpdateHandler(updateServiceWorker)
appStore.setUpdateChecker(updateServiceWorker.update)

// Check periodically and whenever the user returns to the app. A running PWA
// otherwise may keep an older service worker for a long listening session.
const checkForUpdate = () => appStore.checkUpdate().catch(() => undefined)
window.setInterval(checkForUpdate, 60 * 60 * 1000)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkForUpdate()
})
