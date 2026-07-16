<script setup lang="ts">
import { ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useMediaSession } from '@/composables/useMediaSession'
import { useAuthStore } from '@/stores/auth'

const audio = ref<HTMLAudioElement | null>(null)
const player = usePlayerStore()
const auth = useAuthStore()
const { onTimeUpdate, onLoadedMetadata } = useAudioPlayer(audio)
useMediaSession()

function handleError() {
  const isAudius = auth.session?.provider === 'audius'
  const message = isAudius
    ? '这首 Audius 歌曲当前无法播放。公开节点可能暂时不可用，请稍后重试或换一首歌。'
    : audio.value?.error?.code === MediaError.MEDIA_ERR_NETWORK
      ? '无法加载歌曲。请检查网络、服务器地址或跨域设置。'
      : '这首歌曲当前无法播放。Jellyfin 或 Navidrome 可能需要为浏览器转码此音频。'
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
