import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    deferredInstallPrompt: null as BeforeInstallPromptEvent | null,
    updateAvailable: false,
    offlineReady: false,
    serviceWorkerError: '',
    updateServiceWorker: null as null | ((reloadPage?: boolean) => Promise<void>),
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
    async applyUpdate() {
      if (!this.updateServiceWorker) return
      await this.updateServiceWorker(true)
    },
  },
})
