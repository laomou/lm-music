import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    deferredInstallPrompt: null as BeforeInstallPromptEvent | null,
    updateAvailable: false,
    offlineReady: false,
    isOffline: !navigator.onLine,
    serviceWorkerError: '',
    updateServiceWorker: null as null | ((reloadPage?: boolean) => Promise<void>),
    checkForUpdate: null as null | (() => Promise<void>),
  }),
  getters: {
    canInstall: (state) => Boolean(state.deferredInstallPrompt),
  },
  actions: {
    setInstallPrompt(event: BeforeInstallPromptEvent) {
      this.deferredInstallPrompt = event
    },
    clearInstallPrompt() {
      this.deferredInstallPrompt = null
    },
    setOffline(isOffline: boolean) {
      this.isOffline = isOffline
    },
    async install() {
      if (!this.deferredInstallPrompt) return false
      await this.deferredInstallPrompt.prompt()
      const choice = await this.deferredInstallPrompt.userChoice
      this.clearInstallPrompt()
      return choice.outcome === 'accepted'
    },
    setUpdateHandler(handler: (reloadPage?: boolean) => Promise<void>) {
      this.updateServiceWorker = handler
    },
    setUpdateChecker(checker: () => Promise<void>) {
      this.checkForUpdate = checker
    },
    async checkUpdate() {
      await this.checkForUpdate?.()
    },
    async applyUpdate() {
      if (!this.updateServiceWorker) return
      await this.updateServiceWorker(true)
    },
  },
})
