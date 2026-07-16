import { defineStore } from 'pinia'
import type { Playlist, Track } from '@/types/music'
import {
  clearServerOfflineData,
  deleteDownloadedTrack,
  downloadTrack,
  getCachedAudioUrl,
  getDownloadedTracks,
  getStorageEstimate,
  requestPersistentStorage,
  serverCacheId,
  type DownloadedTrack,
} from '@/services/offline-storage'
import { useAuthStore } from './auth'

export type DownloadTask = { id: string; label: string; completed: number; total: number; status: 'downloading' | 'completed' | 'failed'; error?: string }

export const useDownloadsStore = defineStore('downloads', {
  state: () => ({
    tracks: [] as DownloadedTrack[],
    totalBytes: 0,
    tasks: [] as DownloadTask[],
    loading: false,
    error: '',
    storageUsage: 0,
    storageQuota: 0,
  }),
  getters: {
    serverId: () => {
      const auth = useAuthStore()
      return serverCacheId(auth.session?.serverUrl, auth.session?.userId)
    },
    isDownloaded: (state) => (trackId: string) => state.tracks.some((item) => item.trackId === trackId),
    taskFor: (state) => (id: string) => state.tasks.find((task) => task.id === id),
  },
  actions: {
    async refresh() {
      this.loading = true
      try {
        const result = await getDownloadedTracks(this.serverId)
        this.tracks = result.tracks
        this.totalBytes = result.totalBytes
        const storage = await getStorageEstimate()
        this.storageUsage = storage.usage
        this.storageQuota = storage.quota
      } catch (error) {
        this.error = error instanceof Error ? error.message : '无法读取离线内容。'
      } finally {
        this.loading = false
      }
    },
    async downloadSingle(track: Track, playlistId?: string) {
      if (this.isDownloaded(track.id)) return
      const task: DownloadTask = { id: `track:${track.id}`, label: track.title, completed: 0, total: 1, status: 'downloading' }
      this.tasks = [...this.tasks.filter((item) => item.id !== task.id), task]
      try {
        await requestPersistentStorage()
        await downloadTrack(this.serverId, track, playlistId)
        task.completed = 1
        task.status = 'completed'
        await this.refresh()
      } catch (error) {
        task.status = 'failed'
        task.error = error instanceof Error ? error.message : '下载失败。'
        this.error = task.error
      }
    },
    async downloadPlaylist(playlist: Playlist) {
      const task: DownloadTask = { id: `playlist:${playlist.id}`, label: playlist.name, completed: 0, total: playlist.tracks.length, status: 'downloading' }
      this.tasks = [...this.tasks.filter((item) => item.id !== task.id), task]
      try {
        await requestPersistentStorage()
        for (const track of playlist.tracks) {
          if (!this.isDownloaded(track.id)) await downloadTrack(this.serverId, track, playlist.id)
          task.completed += 1
          await this.refresh()
        }
        task.status = 'completed'
      } catch (error) {
        task.status = 'failed'
        task.error = error instanceof Error ? error.message : '歌单下载失败。'
        this.error = task.error
      }
    },
    async remove(track: DownloadedTrack) {
      await deleteDownloadedTrack(track.id)
      await this.refresh()
    },
    async clearAll() {
      await clearServerOfflineData(this.serverId, false)
      await this.refresh()
    },
    async getPlayableUrl(track: Track) {
      const record = this.tracks.find((item) => item.trackId === track.id)
      return record ? getCachedAudioUrl(record.audioCacheKey) : null
    },
  },
})
