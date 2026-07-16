<script setup lang="ts">
import { ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useMediaSession } from '@/composables/useMediaSession'

const audio = ref<HTMLAudioElement | null>(null)
const player = usePlayerStore()
const { onTimeUpdate, onLoadedMetadata } = useAudioPlayer(audio)
useMediaSession()
</script>

<template>
  <audio
    ref="audio"
    preload="metadata"
    @timeupdate="onTimeUpdate"
    @loadedmetadata="onLoadedMetadata"
    @ended="player.handleEnded()"
    @error="player.isPlaying = false"
  />
</template>
