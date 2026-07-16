<script setup lang="ts">
import { computed } from 'vue'
import { Pause, Play, Repeat1, Repeat2, Shuffle, SkipBack, SkipForward } from '@lucide/vue'
import { usePlayerStore } from '@/stores/player'
import { t } from '@/i18n'

const player = usePlayerStore()
const canGoPrevious = computed(() => player.currentTime > 3 || player.hasPrevious)
const canGoNext = computed(() => player.queue.length > 1 && (player.shuffle || player.hasNext || player.repeatMode === 'all'))
const shuffleLabel = computed(() => player.shuffle ? t('player.shuffleOn') : t('player.shuffleOff'))
const repeatLabel = computed(() => player.repeatMode === 'one' ? t('player.repeatOne') : player.repeatMode === 'all' ? t('player.repeatAll') : t('player.repeatOff'))
</script>

<template>
  <div class="player-controls" role="toolbar" :aria-label="t('player.nowPlaying')">
    <button type="button" class="icon-button secondary" :class="{ active: player.shuffle }" :aria-label="shuffleLabel" :aria-pressed="player.shuffle" :disabled="player.queue.length < 2" @click="player.toggleShuffle()"><Shuffle /></button>
    <button type="button" class="icon-button" :aria-label="t('player.previous')" aria-keyshortcuts="P" :disabled="!canGoPrevious" @click="player.previous()"><SkipBack /></button>
    <button type="button" class="play-button" :aria-label="player.isPlaying ? t('player.pause') : t('player.play')" aria-keyshortcuts="Space" :aria-pressed="player.isPlaying" @click="player.togglePlayback()">
      <Pause v-if="player.isPlaying" :size="28" fill="currentColor" />
      <Play v-else :size="28" fill="currentColor" />
    </button>
    <button type="button" class="icon-button" :aria-label="t('player.next')" aria-keyshortcuts="N" :disabled="!canGoNext" @click="player.next()"><SkipForward /></button>
    <button type="button" class="icon-button secondary" :class="{ active: player.repeatMode !== 'off' }" :aria-label="repeatLabel" :aria-pressed="player.repeatMode !== 'off'" @click="player.cycleRepeatMode()"><Repeat1 v-if="player.repeatMode === 'one'" /><Repeat2 v-else /></button>
  </div>
</template>
