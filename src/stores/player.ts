import { defineStore } from 'pinia'
import type { RepeatMode, Track } from '@/types/music'

const STORAGE_KEY = 'lm-music-player'

type PersistedPlayer = {
  currentTrack?: Track | null
  queue?: Track[]
  currentIndex?: number
  currentTime: number
  volume: number
  muted: boolean
  shuffle: boolean
  repeatMode: RepeatMode
  recentTracks?: RecentTrack[]
  favoriteTracks?: FavoriteTrack[]
}

export type RecentTrack = Track & { playedAt: number }
export type FavoriteTrack = Track & { favoritedAt: number }

const restore = (): PersistedPlayer => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as PersistedPlayer
  } catch {
    return { currentTime: 0, volume: 0.8, muted: false, shuffle: false, repeatMode: 'off' }
  }
}

export const usePlayerStore = defineStore('player', {
  state: () => {
    const saved = restore()
    return {
      currentTrack: null as Track | null,
      queue: [] as Track[],
      currentIndex: -1,
      currentTime: saved.currentTime ?? 0,
      lastPersistedTime: saved.currentTime ?? 0,
      duration: 0,
      isPlaying: false,
      volume: saved.volume ?? 0.8,
      muted: saved.muted ?? false,
      shuffle: saved.shuffle ?? false,
      repeatMode: saved.repeatMode ?? 'off' as RepeatMode,
      recentTracks: saved.recentTracks ?? [] as RecentTrack[],
      favoriteTracks: saved.favoriteTracks ?? [] as FavoriteTrack[],
      error: '',
    }
  },
  getters: {
    hasPrevious: (state) => state.currentIndex > 0,
    hasNext: (state) => state.currentIndex >= 0 && state.currentIndex < state.queue.length - 1,
  },
  actions: {
    persist() {
      this.lastPersistedTime = this.currentTime
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentTrack: this.currentTrack,
        queue: this.queue,
        currentIndex: this.currentIndex,
        currentTime: this.currentTime,
        volume: this.volume,
        muted: this.muted,
        shuffle: this.shuffle,
        repeatMode: this.repeatMode,
        recentTracks: this.recentTracks,
        favoriteTracks: this.favoriteTracks,
      }))
    },
    restorePlayback() {
      const saved = restore()
      if (!saved.currentTrack) return
      this.currentTrack = saved.currentTrack
      this.queue = saved.queue?.length ? saved.queue : [saved.currentTrack]
      const queueIndex = saved.currentIndex ?? this.queue.findIndex((track) => track.id === saved.currentTrack?.id)
      this.currentIndex = Math.max(0, Math.min(queueIndex, this.queue.length - 1))
      this.currentTime = saved.currentTime ?? 0
      this.duration = saved.currentTrack.duration
      // A restored app should never try to autoplay without a user gesture.
      this.isPlaying = false
    },
    rememberTrack(track: Track) {
      this.recentTracks = [
        { ...track, playedAt: Date.now() },
        ...this.recentTracks.filter((item) => item.id !== track.id),
      ].slice(0, 12)
    },
    clearRecentTracks() {
      this.recentTracks = []
      this.persist()
    },
    isFavorite(trackId: string) {
      return this.favoriteTracks.some((item) => item.id === trackId)
    },
    toggleFavorite(track: Track) {
      this.favoriteTracks = this.isFavorite(track.id)
        ? this.favoriteTracks.filter((item) => item.id !== track.id)
        : [{ ...track, favoritedAt: Date.now() }, ...this.favoriteTracks]
      this.persist()
    },
    play(track: Track, queue: Track[], startTime = 0) {
      this.error = ''
      this.queue = queue
      this.currentIndex = Math.max(queue.findIndex((item) => item.id === track.id), 0)
      this.currentTrack = queue[this.currentIndex] ?? track
      this.currentTime = startTime
      this.duration = track.duration
      this.isPlaying = true
      this.rememberTrack(this.currentTrack)
      this.persist()
    },
    togglePlayback() {
      if (!this.currentTrack) return
      this.isPlaying = !this.isPlaying
      if (this.isPlaying) this.error = ''
      this.persist()
    },
    setTime(time: number) {
      this.currentTime = Math.max(0, time)
      // Audio timeupdate fires several times per second. Persisting every
      // event makes playback needlessly write to localStorage, so save at a
      // useful cadence and always flush on pause/visibility changes.
      if (Math.abs(this.currentTime - this.lastPersistedTime) >= 2) this.persist()
    },
    setDuration(duration: number) {
      this.duration = duration
    },
    setVolume(volume: number) {
      this.volume = volume
      this.muted = volume === 0
      this.persist()
    },
    toggleMuted() {
      this.muted = !this.muted
      this.persist()
    },
    toggleShuffle() {
      this.shuffle = !this.shuffle
      this.persist()
    },
    cycleRepeatMode() {
      this.repeatMode = this.repeatMode === 'off' ? 'all' : this.repeatMode === 'all' ? 'one' : 'off'
      this.persist()
    },
    removeFromQueue(index: number) {
      if (index < 0 || index >= this.queue.length || index === this.currentIndex) return
      this.queue.splice(index, 1)
      if (index < this.currentIndex) this.currentIndex -= 1
      this.persist()
    },
    clearUpcoming() {
      if (!this.currentTrack) return
      this.queue = [this.currentTrack]
      this.currentIndex = 0
      this.persist()
    },
    addToQueue(track: Track) {
      if (!this.currentTrack) {
        this.play(track, [track])
        return
      }
      this.queue = [...this.queue, track]
      this.persist()
    },
    next() {
      if (!this.queue.length || !this.currentTrack) return
      if (this.shuffle && this.queue.length > 1) {
        let index = this.currentIndex
        while (index === this.currentIndex) index = Math.floor(Math.random() * this.queue.length)
        this.currentIndex = index
      } else if (this.currentIndex < this.queue.length - 1) {
        this.currentIndex += 1
      } else if (this.repeatMode === 'all') {
        this.currentIndex = 0
      } else {
        this.isPlaying = false
        this.currentTime = 0
        this.persist()
        return
      }
      this.currentTrack = this.queue[this.currentIndex]
      this.currentTime = 0
      this.duration = this.currentTrack.duration
      this.isPlaying = true
      this.rememberTrack(this.currentTrack)
      this.persist()
    },
    previous() {
      if (!this.queue.length || !this.currentTrack) return
      if (this.currentTime > 3) {
        this.currentTime = 0
      } else if (this.currentIndex > 0) {
        this.currentIndex -= 1
        this.currentTrack = this.queue[this.currentIndex]
        this.duration = this.currentTrack.duration
        this.currentTime = 0
        this.rememberTrack(this.currentTrack)
      }
      this.persist()
    },
    handleEnded() {
      if (this.repeatMode === 'one') {
        this.currentTime = 0
        this.isPlaying = true
        return
      }
      this.next()
    },
    setError(message: string) {
      this.error = message
      this.isPlaying = false
      this.persist()
    },
    clearError() {
      this.error = ''
    },
    clearPlayback() {
      this.currentTrack = null
      this.queue = []
      this.currentIndex = -1
      this.currentTime = 0
      this.duration = 0
      this.isPlaying = false
      this.error = ''
      this.recentTracks = []
      this.persist()
    },
  },
})
