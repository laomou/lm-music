import { defineStore } from 'pinia'
import { getLibrary, getDownloadedTracks, saveLibrary } from '@/services/offline-storage'
import { getProviderForSession, sessionCacheId } from '@/services/providers'
import type { Playlist } from '@/types/music'
import { useAuthStore } from './auth'
import { t } from '@/i18n'

export const useLibraryStore = defineStore('library', {
  state: () => ({ playlists: [] as Playlist[], loading: false, error: '', source: 'network' as 'network' | 'cache', fetchToken: 0 }),
  getters: {
    offlinePlaylists: (state) => state.playlists.filter((playlist) => playlist.tracks.length > 0),
  },
  actions: {
    clear() {
      this.fetchToken += 1
      this.playlists = []
      this.loading = false
      this.error = ''
      this.source = 'network'
    },
    async fetchPlaylists() {
      const token = ++this.fetchToken
      this.loading = true
      this.error = ''
      const auth = useAuthStore()
      const cacheId = sessionCacheId(auth.session)
      const isCurrentFetch = () => token === this.fetchToken && cacheId === sessionCacheId(useAuthStore().session)
      try {
        const cached = await getLibrary(cacheId)
        if (!isCurrentFetch()) return
        if (cached?.playlists.length) {
          this.playlists = cached.playlists
          this.source = 'cache'
        }
        if (!auth.session) {
          if (!this.playlists.length) throw new Error(t('error.connectSourceFirst'))
          return
        }
        if (!navigator.onLine) {
          if (!this.playlists.length) throw new Error(t('error.noCachedPlaylists'))
          const downloaded = await getDownloadedTracks(cacheId)
          const trackIds = new Set(downloaded.tracks.map((track) => track.trackId))
          this.playlists = this.playlists
            .map((playlist) => ({ ...playlist, tracks: playlist.tracks.filter((track) => trackIds.has(track.id)) }))
            .filter((playlist) => playlist.tracks.length > 0)
          return
        }
        const playlists = await getProviderForSession(auth.session).createClient(auth.session).getPlaylists()
        if (!isCurrentFetch()) return
        this.playlists = playlists
        this.source = 'network'
        await saveLibrary(cacheId, playlists)
      } catch (error) {
        if (!isCurrentFetch()) return
        if (!this.playlists.length) this.error = error instanceof Error ? error.message : t('error.readLibraryFailed')
        else this.source = 'cache'
      } finally {
        if (isCurrentFetch()) this.loading = false
      }
    },
    async loadLyrics(trackId: string) {
      const auth = useAuthStore()
      if (!auth.session || !navigator.onLine) return
      const session = auth.session
      const cacheId = sessionCacheId(session)
      const track = this.playlists.flatMap((playlist) => playlist.tracks).find((item) => item.id === trackId)
      if (track && !track.lyrics.length) {
        try {
          const lyrics = await getProviderForSession(session).createClient(session).getLyrics(trackId)
          if (cacheId !== sessionCacheId(useAuthStore().session)) return
          track.lyrics = lyrics
          await saveLibrary(cacheId, this.playlists)
        } catch {
          // Lyrics are optional. Keep playback and the rest of the library usable.
        }
      }
    },
  },
})
