import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePlayerStore } from '@/stores/player'
import type { Track } from '@/types/music'

const track = (id: string): Track => ({
  id,
  title: `Track ${id}`,
  artist: 'LM Music',
  duration: 180,
  streamUrl: `https://music.example/${id}.mp3`,
  lyrics: [],
})

describe('player store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('copies the input queue instead of retaining an external array reference', () => {
    const player = usePlayerStore()
    const queue = [track('one'), track('two')]

    player.play(queue[0]!, queue)
    queue.splice(1, 1)

    expect(player.queue).toHaveLength(2)
    expect(player.queue.map((item) => item.id)).toEqual(['one', 'two'])
  })

  it('keeps the current track selected when the queue is reordered', () => {
    const player = usePlayerStore()
    const queue = [track('one'), track('two'), track('three')]
    player.play(queue[1]!, queue)

    player.reorderQueue(0, 2)

    expect(player.queue.map((item) => item.id)).toEqual(['two', 'three', 'one'])
    expect(player.currentTrack?.id).toBe('two')
    expect(player.currentIndex).toBe(0)
  })

  it('does not autoplay restored playback', () => {
    const persisted = track('saved')
    localStorage.setItem('lm-music-player', JSON.stringify({
      currentTrack: persisted,
      queue: [persisted],
      currentIndex: 0,
    }))
    const player = usePlayerStore()

    player.restorePlayback()

    expect(player.currentTrack?.id).toBe('saved')
    expect(player.currentTime).toBe(0)
    expect(player.isPlaying).toBe(false)
  })
})
