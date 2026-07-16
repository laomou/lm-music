<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useMediaSession } from '@/composables/useMediaSession'
import { useAuthStore } from '@/stores/auth'
import { useLibraryStore } from '@/stores/library'
import { useDownloadsStore } from '@/stores/downloads'
import { t } from '@/i18n'
import type { MusicSession } from '@/types/music'

function sessionKey(session: MusicSession | null) {
  return session ? `${session.provider}:${session.serverUrl}:${session.username}` : 'disconnected'
}

const audio = ref<HTMLAudioElement | null>(null)
const player = usePlayerStore()
const auth = useAuthStore()
const library = useLibraryStore()
const downloads = useDownloadsStore()
const activeSessionKey = ref(sessionKey(auth.session))
const { onTimeUpdate, onLoadedMetadata } = useAudioPlayer(audio)
useMediaSession()
onMounted(() => player.restorePlayback())

auth.$subscribe(() => {
  const nextSessionKey = sessionKey(auth.session)
  if (nextSessionKey === activeSessionKey.value) return
  activeSessionKey.value = nextSessionKey
  player.clearPlayback()
  library.clear()
  downloads.clearState()
})

function handleError() {
  const isAudius = auth.session?.provider === 'audius'
  const message = isAudius
    ? t('player.audiusError')
    : audio.value?.error?.code === MediaError.MEDIA_ERR_NETWORK
      ? t('player.networkError')
      : t('player.codecError')
  player.setError(message)
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
