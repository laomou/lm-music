import { defineStore } from 'pinia'
import { JellyfinClient } from '@/services/jellyfin/client'
import { NavidromeClient } from '@/services/navidrome/client'
import { getLibrary, getDownloadedTracks, saveLibrary, serverCacheId } from '@/services/offline-storage'
import type { Playlist } from '@/types/music'
import { useAuthStore } from './auth'

export const useLibraryStore = defineStore('library', {
  state: () => ({ playlists: [] as Playlist[], loading: false, error: '', source: 'network' as 'network' | 'cache' }),
  getters: {
    offlinePlaylists: (state) => state.playlists.filter((playlist) => playlist.tracks.length > 0),
  },
  actions: {
    async fetchPlaylists() {
      this.loading = true
      this.error = ''
      const auth = useAuthStore()
      const cacheId = serverCacheId(auth.session?.serverUrl, auth.session?.provider === 'jellyfin' ? auth.session.userId : auth.session?.username, auth.session?.provider)
      try {
        const cached = await getLibrary(cacheId)
        if (cached?.playlists.length) {
          this.playlists = cached.playlists
          this.source = 'cache'
        }
        if (!auth.session) {
          if (!this.playlists.length) throw new Error('请先连接 Jellyfin 服务器。')
          return
        }
        if (!navigator.onLine) {
          if (!this.playlists.length) throw new Error('当前离线，且没有已缓存的 Jellyfin 歌单。')
          const downloaded = await getDownloadedTracks(cacheId)
          const trackIds = new Set(downloaded.tracks.map((track) => track.trackId))
          this.playlists = this.playlists
            .map((playlist) => ({ ...playlist, tracks: playlist.tracks.filter((track) => trackIds.has(track.id)) }))
            .filter((playlist) => playlist.tracks.length > 0)
          return
        }
        const playlists = auth.session.provider === 'jellyfin'
          ? await new JellyfinClient(auth.session).getPlaylists()
          : await new NavidromeClient(auth.session).getPlaylists()
        this.playlists = playlists
        this.source = 'network'
        await saveLibrary(cacheId, playlists)
      } catch (error) {
        if (!this.playlists.length) this.error = error instanceof Error ? error.message : '无法读取 Jellyfin 歌单。'
        else this.source = 'cache'
      } finally {
        this.loading = false
      }
    },
    async loadLyrics(trackId: string) {
      const auth = useAuthStore()
      if (!auth.session || !navigator.onLine) return
      const track = this.playlists.flatMap((playlist) => playlist.tracks).find((item) => item.id === trackId)
      if (track && !track.lyrics.length) {
        track.lyrics = auth.session.provider === 'jellyfin'
          ? await new JellyfinClient(auth.session).getLyrics(trackId)
          : await new NavidromeClient(auth.session).getLyrics(trackId)
        await saveLibrary(serverCacheId(auth.session.serverUrl, auth.session.provider === 'jellyfin' ? auth.session.userId : auth.session.username, auth.session.provider), this.playlists)
      }
    },
  },
})
