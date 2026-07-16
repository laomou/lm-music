import { defineStore } from 'pinia'
import type { JellyfinSession } from '@/types/music'

const STORAGE_KEY = 'lm-music-jellyfin-session'

const loadSession = (): JellyfinSession | null => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as JellyfinSession | null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({ session: loadSession() as JellyfinSession | null }),
  getters: { isConnected: (state) => Boolean(state.session) },
  actions: {
    saveSession(session: JellyfinSession) {
      this.session = session
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    },
    logout() {
      this.session = null
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
