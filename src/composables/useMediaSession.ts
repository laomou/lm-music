import { watch } from 'vue'
import type { Track } from '@/types/music'
import { usePlayerStore } from '@/stores/player'

export function useMediaSession() {
  const player = usePlayerStore()
  if (!('mediaSession' in navigator)) return
  watch(() => player.currentTrack, (track: Track | null) => {
    document.title = track ? `${track.title} · ${track.artist} — LM Music` : 'LM Music'
    if (!track) return
    navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist, album: track.album, artwork: track.coverUrl ? [{ src: track.coverUrl, sizes: '512x512' }] : [] })
  }, { immediate: true })
  watch(() => player.isPlaying, (isPlaying) => { navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused' })
  watch(
    [() => player.currentTime, () => player.duration, () => player.currentTrack?.duration],
    ([position, duration, trackDuration]) => {
      const effectiveDuration = duration || trackDuration || 0
      if (!Number.isFinite(effectiveDuration) || effectiveDuration <= 0) return
      try {
        navigator.mediaSession.setPositionState({
          duration: effectiveDuration,
          position: Math.min(Math.max(position, 0), effectiveDuration),
        })
      } catch {
        // Some browsers expose Media Session but do not accept a position
        // state for every stream type. Metadata and controls still work.
      }
    },
    { immediate: true },
  )
  navigator.mediaSession.setActionHandler('play', () => { if (!player.isPlaying) player.togglePlayback() })
  navigator.mediaSession.setActionHandler('pause', () => { if (player.isPlaying) player.togglePlayback() })
  navigator.mediaSession.setActionHandler('previoustrack', () => player.previous())
  navigator.mediaSession.setActionHandler('nexttrack', () => player.next())
  navigator.mediaSession.setActionHandler('seekto', (details) => { if (details.seekTime !== undefined) player.setTime(details.seekTime) })
  navigator.mediaSession.setActionHandler('seekbackward', (details) => player.setTime(Math.max(0, player.currentTime - (details.seekOffset ?? 10))))
  navigator.mediaSession.setActionHandler('seekforward', (details) => player.setTime(Math.min(player.duration, player.currentTime + (details.seekOffset ?? 10))))
}
