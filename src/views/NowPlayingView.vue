<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import PlayerControls from '@/components/PlayerControls.vue'
import SyncedLyrics from '@/components/SyncedLyrics.vue'
import { useLibraryStore } from '@/stores/library'
import { usePlayerStore } from '@/stores/player'
import { formatDuration } from '@/utils/formatDuration'

const router = useRouter()
const player = usePlayerStore()
const library = useLibraryStore()
const track = computed(() => player.currentTrack)

watch(() => track.value?.id, (id) => { if (id) library.loadLyrics(id) }, { immediate: true })

function seek(event: Event) {
  player.setTime(Number((event.target as HTMLInputElement).value))
}
</script>

<template>
  <section v-if="track" class="page now-playing">
    <header class="now-header"><button class="back-button" aria-label="返回歌单" @click="router.push('/playlists')">⌄</button><p>正在播放</p><span></span></header>
    <div class="player-layout">
      <div class="player-main">
        <img class="now-cover" :src="track.coverUrl" alt="" />
        <div class="now-track"><div><h1>{{ track.title }}</h1><p>{{ track.artist }}</p></div><button class="heart-button" aria-label="喜欢">♡</button></div>
        <div v-if="player.error" class="playback-error"><span>{{ player.error }}</span><button @click="player.togglePlayback()">重试</button></div>
        <div class="progress-wrap"><input :value="player.currentTime" type="range" min="0" :max="player.duration || track.duration" step="0.1" aria-label="播放进度" @input="seek" /><div><time>{{ formatDuration(player.currentTime) }}</time><time>{{ formatDuration(player.duration || track.duration) }}</time></div></div>
        <PlayerControls />
        <div class="volume-row"><span>{{ player.muted || player.volume === 0 ? '◌' : '◖' }}</span><input :value="player.muted ? 0 : player.volume" type="range" min="0" max="1" step="0.01" aria-label="音量" @input="player.setVolume(Number(($event.target as HTMLInputElement).value))" /><button @click="player.toggleMuted()">{{ player.muted ? '取消静音' : '静音' }}</button></div>
      </div>
      <SyncedLyrics :lines="track.lyrics" :current-time="player.currentTime" @seek="player.setTime" />
    </div>
    <section class="queue-panel"><div class="section-heading"><h2>当前播放列表</h2><span>{{ player.currentIndex + 1 }} / {{ player.queue.length }}</span></div><div class="queue-items"><button v-for="(item, index) in player.queue" :key="item.id" :class="{ current: item.id === track.id }" @click="player.play(item, player.queue)"><span>{{ index + 1 }}</span><strong>{{ item.title }}</strong><small>{{ item.artist }}</small></button></div></section>
  </section>
  <section v-else class="page empty-state"><p>尚未开始播放。</p><button class="primary-button" @click="router.push('/playlists')">浏览歌单</button></section>
</template>
