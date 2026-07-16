<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'

const player = usePlayerStore()
const router = useRouter()
</script>

<template>
  <button v-if="player.currentTrack" class="mini-player" @click="router.push('/now-playing')">
    <img :src="player.currentTrack.coverUrl" alt="" />
    <span class="mini-meta"><strong>{{ player.currentTrack.title }}</strong><small>{{ player.currentTrack.artist }}</small></span>
    <span class="mini-toggle" @click.stop="player.togglePlayback()">{{ player.isPlaying ? 'Ⅱ' : '▶' }}</span>
  </button>
</template>
