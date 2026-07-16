<script setup lang="ts">
import { ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useMediaSession } from '@/composables/useMediaSession'
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'
import { t } from '@/i18n'

const audio = ref<HTMLAudioElement | null>(null)
const player = usePlayerStore()
const auth = useAuthStore()
const { onTimeUpdate, onLoadedMetadata } = useAudioPlayer(audio)
useMediaSession()
onMounted(() => player.restorePlayback())

function handleError() {
  const isAudius = auth.session?.provider === 'audius'
  const message = isAudius
    ? t('player.audiusError')
    : audio.value?.error?.code === MediaError.MEDIA_ERR_NETWORK
      ? t('player.networkError')
      : t('player.codecError')
  player.setError(message)
}
</script>

<template>
  <audio
    ref="audio"
    preload="metadata"
    @timeupdate="onTimeUpdate"
    @loadedmetadata="onLoadedMetadata"
    @ended="player.handleEnded()"
    @error="handleError"
  />
</template>
