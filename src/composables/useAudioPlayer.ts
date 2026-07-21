import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { resolveLocalStreamUrl } from '@/services/local/client'

export function useAudioPlayer(audio: Ref<HTMLAudioElement | null>) {
  const player = usePlayerStore()
  const persistPlayback = () => player.persist()
  let activeBlobUrl = ''
  let sourceLoadId = 0

  function releaseActiveBlobUrl() {
    if (!activeBlobUrl) return
    URL.revokeObjectURL(activeBlobUrl)
    activeBlobUrl = ''
  }

  async function loadSource() {
    const audioElement = audio.value
    const track = player.currentTrack
    const loadId = ++sourceLoadId

    if (!audioElement) return
    if (!track) {
      releaseActiveBlobUrl()
      audioElement.removeAttribute('src')
      audioElement.load()
      return
    }

    let src = track.streamUrl
    let resolvedBlobUrl = ''
    if (track.id.startsWith('local:')) {
      try {
        resolvedBlobUrl = await resolveLocalStreamUrl(track.id) ?? ''
      } catch {
        resolvedBlobUrl = ''
      }
      if (loadId !== sourceLoadId) {
        if (resolvedBlobUrl) URL.revokeObjectURL(resolvedBlobUrl)
        return
      }
      src = resolvedBlobUrl
    }

    releaseActiveBlobUrl()
    activeBlobUrl = resolvedBlobUrl
    audioElement.src = src
    audioElement.currentTime = Math.min(player.currentTime, track.duration)

    if (player.isPlaying) {
      try { await audioElement.play() } catch { player.togglePlayback() }
    }
  }

  watch(() => {
    const track = player.currentTrack
    if (!track) return ''
    // Local blob URLs are short-lived and must always be re-created from the
    // saved directory handle. Remote tracks reload when their stream URL changes.
    return track.id.startsWith('local:') ? `local:${track.id}` : `${track.id}:${track.streamUrl}`
  }, () => { void loadSource() }, { immediate: true })
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
    sourceLoadId += 1
    releaseActiveBlobUrl()
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
