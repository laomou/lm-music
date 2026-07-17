import { defineStore } from 'pinia'
import type { Playlist, Track } from '@/types/music'
import {
  clearServerOfflineData,
  deleteDownloadedTrack,
  downloadTrack,
  getDownloadedTracks,
  getStorageEstimate,
  requestPersistentStorage,
  type DownloadedTrack,
} from '@/services/offline-storage'
import { getProviderForSession, sessionCacheId } from '@/services/providers'
import { useAuthStore } from './auth'
import { t } from '@/i18n'

type DownloadTask = {
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
    refreshToken: 0,
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
    clearState() {
      this.refreshToken += 1
      this.controllers.forEach((controller) => controller.abort())
      this.controllers.clear()
      this.tracks = []
      this.totalBytes = 0
      this.tasks = []
      this.loading = false
      this.error = ''
      this.storageUsage = 0
      this.storageQuota = 0
    },
    async refresh() {
      const token = ++this.refreshToken
      const serverId = this.serverId
      this.loading = true
      try {
        const result = await getDownloadedTracks(serverId)
        if (token !== this.refreshToken || serverId !== this.serverId) return
        this.tracks = result.tracks
        this.totalBytes = result.totalBytes
        const storage = await getStorageEstimate()
        if (token !== this.refreshToken || serverId !== this.serverId) return
        this.storageUsage = storage.usage
        this.storageQuota = storage.quota
        if (!this.tasks.some((task) => task.status === 'failed')) this.error = ''
      } catch (error) {
        if (token !== this.refreshToken || serverId !== this.serverId) return
        this.error = error instanceof Error ? error.message : t('error.readDownloadsFailed')
      } finally {
        if (token === this.refreshToken && serverId === this.serverId) this.loading = false
      }
    },
    async downloadSingle(track: Track, playlistId?: string) {
      this.error = ''
      if (!navigator.onLine) { this.error = t('error.downloadOffline'); return }
      const auth = useAuthStore()
      if (track.allowOfflineDownload === false || (auth.session && !getProviderForSession(auth.session).supportsOfflineDownload)) {
        this.error = t('error.streamingOnly')
        return
      }
      if (this.isDownloaded(track.id)) return
      const task: DownloadTask = { id: `track:${track.id}`, label: track.title, completed: 0, total: 1, receivedBytes: 0, totalBytes: 0, status: 'downloading' }
      if (this.taskFor(task.id)?.status === 'downloading') return
      this.tasks = [...this.tasks.filter((item) => item.id !== task.id), task]
      const currentTask = this.tasks.find((item) => item.id === task.id) ?? task
      const controller = new AbortController()
      this.controllers.set(task.id, controller)
      try {
        await requestPersistentStorage()
        await downloadTrack(this.serverId, track, playlistId, controller.signal, (receivedBytes, totalBytes) => {
          currentTask.receivedBytes = receivedBytes
          currentTask.totalBytes = totalBytes
        })
        currentTask.completed = 1
        currentTask.status = 'completed'
        await this.refresh()
      } catch (error) {
        if (controller.signal.aborted) currentTask.status = 'cancelled'
        else {
          currentTask.status = 'failed'
          currentTask.error = error instanceof Error ? error.message : t('error.downloadFailed')
          this.error = currentTask.error
        }
      } finally {
        this.controllers.delete(task.id)
      }
    },
    async downloadPlaylist(playlist: Playlist) {
      this.error = ''
      if (!navigator.onLine) { this.error = t('error.downloadOffline'); return }
      const auth = useAuthStore()
      if (!playlist.tracks.length) return
      if (playlist.tracks.some((track) => track.allowOfflineDownload === false) || (auth.session && !getProviderForSession(auth.session).supportsOfflineDownload)) {
        this.error = t('error.streamingOnly')
        return
      }
      const task: DownloadTask = { id: `playlist:${playlist.id}`, label: playlist.name, completed: 0, total: playlist.tracks.length, receivedBytes: 0, totalBytes: 0, status: 'downloading' }
      if (this.taskFor(task.id)?.status === 'downloading') return
      this.tasks = [...this.tasks.filter((item) => item.id !== task.id), task]
      const currentTask = this.tasks.find((item) => item.id === task.id) ?? task
      const controller = new AbortController()
      this.controllers.set(task.id, controller)
      try {
        await requestPersistentStorage()
        for (const track of playlist.tracks) {
          if (controller.signal.aborted) throw new DOMException(t('error.downloadCancelled'), 'AbortError')
          currentTask.receivedBytes = 0
          currentTask.totalBytes = 0
          if (!this.isDownloaded(track.id)) {
            await downloadTrack(this.serverId, track, playlist.id, controller.signal, (receivedBytes, totalBytes) => {
              currentTask.receivedBytes = receivedBytes
              currentTask.totalBytes = totalBytes
            })
          }
          currentTask.completed += 1
          await this.refresh()
        }
        currentTask.status = 'completed'
      } catch (error) {
        if (controller.signal.aborted) currentTask.status = 'cancelled'
        else {
          currentTask.status = 'failed'
          currentTask.error = error instanceof Error ? error.message : t('error.playlistDownloadFailed')
          this.error = currentTask.error
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
      if (!this.tasks.some((task) => task.status === 'failed')) this.error = ''
    },
    async retry(task: DownloadTask, source: { playlist?: Playlist; track?: Track }) {
      this.error = ''
      if (task.id.startsWith('playlist:') && source.playlist) await this.downloadPlaylist(source.playlist)
      else if (task.id.startsWith('track:') && source.track) await this.downloadSingle(source.track, source.playlist?.id)
      else this.error = t('error.retrySourceMissing')
    },
    async remove(track: DownloadedTrack) {
      this.error = ''
      try {
        await deleteDownloadedTrack(track.id)
        await this.refresh()
      } catch (error) {
        this.error = error instanceof Error ? error.message : t('error.deleteFailed')
      }
    },
    async clearAll() {
      this.error = ''
      this.controllers.forEach((controller) => controller.abort())
      this.controllers.clear()
      this.tasks = this.tasks.map((task) => task.status === 'downloading' ? { ...task, status: 'cancelled' } : task)
      try {
        await clearServerOfflineData(this.serverId, false)
        await this.refresh()
      } catch (error) {
        this.error = error instanceof Error ? error.message : t('error.clearFailed')
      }
    },
  },
})
