<script setup lang="ts">
import { ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useMediaSession } from '@/composables/useMediaSession'

const audio = ref<HTMLAudioElement | null>(null)
const player = usePlayerStore()
const { onTimeUpdate, onLoadedMetadata } = useAudioPlayer(audio)
useMediaSession()

function handleError() {
  const message = audio.value?.error?.code === MediaError.MEDIA_ERR_NETWORK
    ? '无法加载歌曲。请检查网络、Jellyfin 地址或服务器跨域设置。'
    : '这首歌曲当前无法播放。Jellyfin 可能需要为浏览器转码此音频。'
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
