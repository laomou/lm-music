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
    const session = decode(raw) ?? JSON.parse(raw) as MusicSession
    // Subsonic sessions saved before token authentication contain a password.
    // They cannot be safely migrated, so require a one-time sign-in instead.
    if (session.provider === 'subsonic' && (!session.token || !session.salt)) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({ session: loadSession() as MusicSession | null }),
  getters: { isConnected: (state) => Boolean(state.session) },
  actions: {
    saveSession(session: MusicSession, remember = true) {
      this.session = session
      if (remember) localStorage.setItem(STORAGE_KEY, encode(session))
      else localStorage.removeItem(STORAGE_KEY)
    },
    logout() {
      this.session = null
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
