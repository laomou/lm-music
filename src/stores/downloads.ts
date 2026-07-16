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
  type DownloadedTrack,
} from '@/services/offline-storage'
import { getProviderForSession, sessionCacheId } from '@/services/providers'
import { useAuthStore } from './auth'
import { t } from '@/i18n'

export type DownloadTask = {
  id: string
  label: string
  completed: number
  total: number
  receivedBytes: number
  totalBytes: number
  status: 'downloading' | 'completed' | 'failed' | 'cancelled'
  error?: string
}

export const useDownloadsStore = defineStore('downloads', {
  state: () => ({
    tracks: [] as DownloadedTrack[],
    totalBytes: 0,
    tasks: [] as DownloadTask[],
    loading: false,
    error: '',
    storageUsage: 0,
    storageQuota: 0,
    controllers: new Map<string, AbortController>(),
  }),
  getters: {
    serverId: () => {
      const auth = useAuthStore()
      return sessionCacheId(auth.session)
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
        this.error = error instanceof Error ? error.message : t('error.readDownloadsFailed')
      } finally {
        this.loading = false
      }
    },
    async downloadSingle(track: Track, playlistId?: string) {
      const auth = useAuthStore()
      if (track.allowOfflineDownload === false || (auth.session && !getProviderForSession(auth.session).supportsOfflineDownload)) {
        this.error = t('error.streamingOnly')
        return
      }
      if (this.isDownloaded(track.id)) return
      const task: DownloadTask = { id: `track:${track.id}`, label: track.title, completed: 0, total: 1, receivedBytes: 0, totalBytes: 0, status: 'downloading' }
      this.tasks = [...this.tasks.filter((item) => item.id !== task.id), task]
      const controller = new AbortController()
      this.controllers.set(task.id, controller)
      try {
        await requestPersistentStorage()
        await downloadTrack(this.serverId, track, playlistId, controller.signal, (receivedBytes, totalBytes) => {
          task.receivedBytes = receivedBytes
          task.totalBytes = totalBytes
        })
        task.completed = 1
        task.status = 'completed'
        await this.refresh()
      } catch (error) {
        if (controller.signal.aborted) task.status = 'cancelled'
        else {
          task.status = 'failed'
          task.error = error instanceof Error ? error.message : t('error.downloadFailed')
          this.error = task.error
        }
      } finally {
        this.controllers.delete(task.id)
      }
    },
    async downloadPlaylist(playlist: Playlist) {
      const auth = useAuthStore()
      if (playlist.tracks.some((track) => track.allowOfflineDownload === false) || (auth.session && !getProviderForSession(auth.session).supportsOfflineDownload)) {
        this.error = t('error.streamingOnly')
        return
      }
      const task: DownloadTask = { id: `playlist:${playlist.id}`, label: playlist.name, completed: 0, total: playlist.tracks.length, receivedBytes: 0, totalBytes: 0, status: 'downloading' }
      this.tasks = [...this.tasks.filter((item) => item.id !== task.id), task]
      const controller = new AbortController()
      this.controllers.set(task.id, controller)
      try {
        await requestPersistentStorage()
        for (const track of playlist.tracks) {
          if (controller.signal.aborted) throw new DOMException('下载已取消', 'AbortError')
          task.receivedBytes = 0
          task.totalBytes = 0
          if (!this.isDownloaded(track.id)) {
            await downloadTrack(this.serverId, track, playlist.id, controller.signal, (receivedBytes, totalBytes) => {
              task.receivedBytes = receivedBytes
              task.totalBytes = totalBytes
            })
          }
          task.completed += 1
          await this.refresh()
        }
        task.status = 'completed'
      } catch (error) {
        if (controller.signal.aborted) task.status = 'cancelled'
        else {
          task.status = 'failed'
          task.error = error instanceof Error ? error.message : t('error.playlistDownloadFailed')
          this.error = task.error
        }
      } finally {
        this.controllers.delete(task.id)
      }
    },
    cancel(taskId: string) {
      this.controllers.get(taskId)?.abort()
    },
    dismissTask(taskId: string) {
      if (this.controllers.has(taskId)) return
      this.tasks = this.tasks.filter((task) => task.id !== taskId)
    },
    async retry(task: DownloadTask, source: { playlist?: Playlist; track?: Track }) {
      if (task.id.startsWith('playlist:') && source.playlist) await this.downloadPlaylist(source.playlist)
      if (task.id.startsWith('track:') && source.track) await this.downloadSingle(source.track, source.playlist?.id)
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
