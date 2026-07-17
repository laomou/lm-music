<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useMediaSession } from '@/composables/useMediaSession'
import { useAuthStore } from '@/stores/auth'
import { useLibraryStore } from '@/stores/library'
import { useDownloadsStore } from '@/stores/downloads'
import { t } from '@/i18n'
import type { MusicSession } from '@/types/music'

function sessionKey(session: MusicSession | null) {
  if (!session) return 'disconnected'
  const identity = session.provider === 'jellyfin' ? session.userId : session.username
  return `${session.provider}:${session.serverUrl}:${identity}`
}

const audio = ref<HTMLAudioElement | null>(null)
const player = usePlayerStore()
const auth = useAuthStore()
const library = useLibraryStore()
const downloads = useDownloadsStore()
const activeSessionKey = ref(sessionKey(auth.session))
const fallbackAttempted = ref(false)
let autoSkipTimer = 0
const { onTimeUpdate, onLoadedMetadata } = useAudioPlayer(audio)
useMediaSession()
onMounted(() => player.restorePlayback())

watch(() => player.currentTrack?.id, () => {
  fallbackAttempted.value = false
  window.clearTimeout(autoSkipTimer)
})

auth.$subscribe(() => {
  const nextSessionKey = sessionKey(auth.session)
  if (nextSessionKey === activeSessionKey.value) return
  activeSessionKey.value = nextSessionKey
  player.clearPlayback()
  library.clear()
  downloads.clearState()
})

async function handleError() {
  const streamUrl = player.currentTrack?.streamUrl ?? ''
  const insecureFallbackUrl = player.currentTrack?.fallbackStreamUrl ?? ''
  if (location.protocol === 'https:' && (streamUrl.startsWith('http://') || insecureFallbackUrl.startsWith('http://'))) {
    player.setError(t('player.insecureServerError'))
    return
  }

  const fallbackUrl = player.currentTrack?.fallbackStreamUrl
  if (audio.value && fallbackUrl && !fallbackAttempted.value && audio.value.src !== fallbackUrl) {
    fallbackAttempted.value = true
    audio.value.src = fallbackUrl
    audio.value.currentTime = Math.min(player.currentTime, player.currentTrack?.duration ?? player.currentTime)
    try {
      await audio.value.play()
      return
    } catch {
      // Fall through to the user-facing playback error below.
    }
  }

  const isAudius = auth.session?.provider === 'audius'
  const message = isAudius
    ? t('player.audiusError')
    : audio.value?.error?.code === MediaError.MEDIA_ERR_NETWORK
      ? t('player.networkError')
      : t('player.codecError')
  player.setError(message)
  if (player.hasNext) autoSkipTimer = window.setTimeout(() => player.next(), 3000)
}

async function handleEnded() {
  if (player.repeatMode !== 'one' || !audio.value) {
    player.handleEnded()
    return
  }

  player.setTime(0)
  audio.value.currentTime = 0
  try {
    await audio.value.play()
  } catch {
    if (player.isPlaying) player.togglePlayback()
  }
}
</script>

<template>
  <audio
    ref="audio"
    preload="metadata"
    @timeupdate="onTimeUpdate"
    @loadedmetadata="onLoadedMetadata"
    @ended="handleEnded"
    @error="handleError"
  />
</template>
