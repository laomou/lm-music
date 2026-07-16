import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import { usePlayerStore } from '@/stores/player'

export function useAudioPlayer(audio: Ref<HTMLAudioElement | null>) {
  const player = usePlayerStore()
  const persistPlayback = () => player.persist()

  async function loadSource() {
    if (!audio.value || !player.currentTrack) return

    // Keep this synchronous: a song selection is a user gesture, and browsers
    // may reject playback if an async cache lookup happens before audio.play().
    // Downloaded audio is served from the service worker's CacheFirst route.
    audio.value.src = player.currentTrack.streamUrl
    audio.value.currentTime = player.currentTime

    if (player.isPlaying) {
      try { await audio.value.play() } catch { player.isPlaying = false }
    }
  }

  watch(() => player.currentTrack?.id, loadSource, { immediate: true })
  watch(() => player.isPlaying, async (playing) => {
    if (!audio.value || !player.currentTrack) return
    try {
      if (playing) await audio.value.play()
      else audio.value.pause()
    } catch { player.isPlaying = false }
  })
  watch(() => player.currentTime, (time) => {
    if (audio.value && Math.abs(audio.value.currentTime - time) > 1.2) audio.value.currentTime = time
  })
  watch([() => player.volume, () => player.muted], ([volume, muted]) => {
    if (audio.value) audio.value.volume = muted ? 0 : volume
  }, { immediate: true })
  onMounted(() => {
    window.addEventListener('beforeunload', persistPlayback)
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', persistPlayback)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    persistPlayback()
  })

  function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') persistPlayback()
  }

  function onTimeUpdate() { if (audio.value) player.setTime(audio.value.currentTime) }
  function onLoadedMetadata() {
    if (!audio.value) return
    player.setDuration(Number.isFinite(audio.value.duration) ? audio.value.duration : player.currentTrack?.duration ?? 0)
    audio.value.currentTime = player.currentTime
  }

  return { onTimeUpdate, onLoadedMetadata }
}
