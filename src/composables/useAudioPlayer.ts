import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { resolveLocalStreamUrl } from '@/services/local/client'

export function useAudioPlayer(audio: Ref<HTMLAudioElement | null>) {
  const player = usePlayerStore()
  const persistPlayback = () => player.persist()

  async function loadSource() {
    if (!audio.value) return
    if (!player.currentTrack) {
      audio.value.removeAttribute('src')
      audio.value.load()
      return
    }

    let src = player.currentTrack.streamUrl
    if (src.startsWith('blob:') && player.currentTrack.id.startsWith('local:')) {
      const freshUrl = await resolveLocalStreamUrl(player.currentTrack.id)
      if (freshUrl) {
        src = freshUrl
        player.currentTrack.streamUrl = freshUrl
      }
    }

    audio.value.src = src
    audio.value.currentTime = Math.min(player.currentTime, player.currentTrack.duration)

    if (player.isPlaying) {
      try { await audio.value.play() } catch { player.togglePlayback() }
    }
  }

  watch(() => player.currentTrack?.id, loadSource, { immediate: true })
  watch(() => player.isPlaying, async (playing) => {
    if (!audio.value || !player.currentTrack) return
    try {
      if (playing) await audio.value.play()
      else audio.value.pause()
    } catch {
      if (player.isPlaying) player.togglePlayback()
    }
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
    const resumedTime = Math.min(player.currentTime, player.duration)
    if (resumedTime !== player.currentTime) player.setTime(resumedTime)
    audio.value.currentTime = resumedTime
  }

  return { onTimeUpdate, onLoadedMetadata }
}
