import { onBeforeUnmount, watch, type Ref } from 'vue'
import { useDownloadsStore } from '@/stores/downloads'
import { usePlayerStore } from '@/stores/player'

export function useAudioPlayer(audio: Ref<HTMLAudioElement | null>) {
  const player = usePlayerStore()
  const downloads = useDownloadsStore()
  let objectUrl: string | null = null

  async function loadSource() {
    if (!audio.value || !player.currentTrack) return
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      objectUrl = null
    }
    objectUrl = await downloads.getPlayableUrl(player.currentTrack)
    audio.value.src = objectUrl ?? player.currentTrack.streamUrl
    audio.value.currentTime = player.currentTime
    if (player.isPlaying) {
      try { await audio.value.play() } catch { player.isPlaying = false }
    }
  }

  watch(() => player.currentTrack?.id, loadSource)
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
  onBeforeUnmount(() => { if (objectUrl) URL.revokeObjectURL(objectUrl) })

  function onTimeUpdate() { if (audio.value) player.setTime(audio.value.currentTime) }
  function onLoadedMetadata() {
    if (!audio.value) return
    player.setDuration(Number.isFinite(audio.value.duration) ? audio.value.duration : player.currentTrack?.duration ?? 0)
    audio.value.currentTime = player.currentTime
  }

  return { onTimeUpdate, onLoadedMetadata }
}
