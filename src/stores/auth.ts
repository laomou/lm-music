import { defineStore } from 'pinia'
import type { MusicSession } from '@/types/music'

const STORAGE_KEY = 'lm-music-session'

const loadSession = (): MusicSession | null => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as MusicSession | null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({ session: loadSession() as MusicSession | null }),
  getters: { isConnected: (state) => Boolean(state.session) },
  actions: {
    saveSession(session: MusicSession) {
      this.session = session
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    },
    logout() {
      this.session = null
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
