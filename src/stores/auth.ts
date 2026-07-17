import { defineStore } from 'pinia'
import type { MusicSession } from '@/types/music'

const STORAGE_KEY = 'lm-music-session'

function encode(session: MusicSession): string {
  return btoa(encodeURIComponent(JSON.stringify(session)))
}

function decode(value: string): MusicSession | null {
  try {
    return JSON.parse(decodeURIComponent(atob(value))) as MusicSession
  } catch {
    return null
  }
}

const loadSession = (): MusicSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return decode(raw) ?? JSON.parse(raw) as MusicSession
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
      localStorage.setItem(STORAGE_KEY, encode(session))
    },
    logout() {
      this.session = null
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
