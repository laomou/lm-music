<script setup lang="ts">
import { Pause, Play, Repeat1, Repeat2, Shuffle, SkipBack, SkipForward } from '@lucide/vue'
import { usePlayerStore } from '@/stores/player'
import { t } from '@/i18n'

const player = usePlayerStore()
</script>

<template>
  <div class="player-controls" aria-label="播放控制">
    <button class="icon-button secondary" :class="{ active: player.shuffle }" :aria-label="t('player.shuffle')" @click="player.toggleShuffle()"><Shuffle /></button>
    <button class="icon-button" :aria-label="t('player.previous')" @click="player.previous()"><SkipBack /></button>
    <button class="play-button" :aria-label="player.isPlaying ? t('player.pause') : t('player.play')" @click="player.togglePlayback()">
      <Pause v-if="player.isPlaying" :size="28" fill="currentColor" />
      <Play v-else :size="28" fill="currentColor" />
    </button>
    <button class="icon-button" :aria-label="t('player.next')" @click="player.next()"><SkipForward /></button>
    <button class="icon-button secondary" :class="{ active: player.repeatMode !== 'off' }" :aria-label="t('player.repeat')" @click="player.cycleRepeatMode()"><Repeat1 v-if="player.repeatMode === 'one'" /><Repeat2 v-else /></button>
  </div>
</template>
