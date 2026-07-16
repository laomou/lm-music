import { defineStore } from 'pinia'
import type { RepeatMode, Track } from '@/types/music'

const STORAGE_KEY = 'lm-music-player'

type PersistedPlayer = {
  currentTrackId?: string
  currentTime: number
  volume: number
  muted: boolean
  shuffle: boolean
  repeatMode: RepeatMode
}

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
      duration: 0,
      isPlaying: false,
      volume: saved.volume ?? 0.8,
      muted: saved.muted ?? false,
      shuffle: saved.shuffle ?? false,
      repeatMode: saved.repeatMode ?? 'off' as RepeatMode,
    }
  },
  getters: {
    hasPrevious: (state) => state.currentIndex > 0,
    hasNext: (state) => state.currentIndex >= 0 && state.currentIndex < state.queue.length - 1,
  },
  actions: {
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentTrackId: this.currentTrack?.id,
        currentTime: this.currentTime,
        volume: this.volume,
        muted: this.muted,
        shuffle: this.shuffle,
        repeatMode: this.repeatMode,
      }))
    },
    play(track: Track, queue: Track[], startTime = 0) {
      this.queue = queue
      this.currentIndex = Math.max(queue.findIndex((item) => item.id === track.id), 0)
      this.currentTrack = queue[this.currentIndex] ?? track
      this.currentTime = startTime
      this.duration = track.duration
      this.isPlaying = true
      this.persist()
    },
    togglePlayback() {
      if (!this.currentTrack) return
      this.isPlaying = !this.isPlaying
      this.persist()
    },
    setTime(time: number) {
      this.currentTime = time
      this.persist()
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
  },
})
