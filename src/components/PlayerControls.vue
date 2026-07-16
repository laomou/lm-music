<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '@/stores/player'

const player = usePlayerStore()
const repeatLabel = computed(() => player.repeatMode === 'one' ? '↻¹' : '↻')
</script>

<template>
  <div class="player-controls" aria-label="播放控制">
    <button class="icon-button secondary" :class="{ active: player.shuffle }" aria-label="随机播放" @click="player.toggleShuffle()">⇄</button>
    <button class="icon-button" aria-label="上一首" @click="player.previous()">↶</button>
    <button class="play-button" :aria-label="player.isPlaying ? '暂停' : '播放'" @click="player.togglePlayback()">
      {{ player.isPlaying ? 'Ⅱ' : '▶' }}
    </button>
    <button class="icon-button" aria-label="下一首" @click="player.next()">↷</button>
    <button class="icon-button secondary" :class="{ active: player.repeatMode !== 'off' }" aria-label="循环模式" @click="player.cycleRepeatMode()">{{ repeatLabel }}</button>
  </div>
</template>
