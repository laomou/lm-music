<script setup lang="ts">
import { computed } from 'vue'
import { Pause, Play } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { t } from '@/i18n'

const player = usePlayerStore()
const router = useRouter()
const radius = 17
const circumference = 2 * Math.PI * radius
const progress = computed(() => {
  const duration = player.duration || player.currentTrack?.duration || 0
  return duration > 0 ? Math.min(player.currentTime / duration, 1) : 0
})
const progressOffset = computed(() => circumference * (1 - progress.value))
</script>

<template>
  <button v-if="player.currentTrack" class="mini-player" @click="router.push('/now-playing')">
    <img :src="player.currentTrack.coverUrl" alt="" />
    <span class="mini-meta"><strong :title="player.currentTrack.title">{{ player.currentTrack.title }}</strong><small :title="player.currentTrack.artist">{{ player.currentTrack.artist }}</small></span>
    <span class="mini-toggle-wrap">
      <svg class="mini-progress" viewBox="0 0 40 40" aria-hidden="true">
        <circle class="mini-progress-track" cx="20" cy="20" :r="radius" />
        <circle
          class="mini-progress-value"
          cx="20"
          cy="20"
          :r="radius"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="progressOffset"
        />
      </svg>
      <span class="mini-toggle" role="button" :aria-label="player.isPlaying ? t('player.pause') : t('player.play')" @click.stop="player.togglePlayback()"><Pause v-if="player.isPlaying" :size="15" fill="currentColor" /><Play v-else :size="15" fill="currentColor" /></span>
    </span>
  </button>
</template>
