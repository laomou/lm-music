<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import PlayerControls from '@/components/PlayerControls.vue'
import SyncedLyrics from '@/components/SyncedLyrics.vue'
import { useLibraryStore } from '@/stores/library'
import { usePlayerStore } from '@/stores/player'
import { formatDuration } from '@/utils/formatDuration'
import { ChevronDown, Heart, Volume2, VolumeX, X } from '@lucide/vue'
import { t } from '@/i18n'
import CoverImage from '@/components/CoverImage.vue'

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
    <header class="now-header"><button class="back-button" :aria-label="t('common.backToLibrary')" @click="router.push('/playlists')"><ChevronDown /></button><p>{{ t('player.nowPlaying') }}</p><span></span></header>
    <div class="player-layout">
      <div class="player-main">
        <CoverImage class="now-cover" :src="track.coverUrl" alt="" loading="eager" />
        <div class="now-track"><div class="now-track-copy"><h1 :title="track.title">{{ track.title }}</h1><p :title="track.artist">{{ track.artist }}</p></div><button class="heart-button" :aria-label="t('player.like')"><Heart /></button></div>
        <div v-if="player.error" class="playback-error"><span>{{ player.error }}</span><button @click="player.togglePlayback()">{{ t('common.retry') }}</button></div>
        <div class="progress-wrap"><input :value="player.currentTime" type="range" min="0" :max="player.duration || track.duration" step="0.1" :aria-label="t('player.nowPlaying')" @input="seek" /><div><time>{{ formatDuration(player.currentTime) }}</time><time>{{ formatDuration(player.duration || track.duration) }}</time></div></div>
        <PlayerControls />
        <div class="volume-row"><span><VolumeX v-if="player.muted || player.volume === 0" :size="17" /><Volume2 v-else :size="17" /></span><input :value="player.muted ? 0 : player.volume" type="range" min="0" max="1" step="0.01" :aria-label="t('player.volume')" @input="player.setVolume(Number(($event.target as HTMLInputElement).value))" /><button @click="player.toggleMuted()">{{ player.muted ? t('player.unmute') : t('player.mute') }}</button></div>
      </div>
      <SyncedLyrics :lines="track.lyrics" :current-time="player.currentTime" @seek="player.setTime" />
    </div>
    <section class="queue-panel"><div class="section-heading"><h2>{{ t('player.queue') }}</h2><div class="queue-heading-actions"><span>{{ player.currentIndex + 1 }} / {{ player.queue.length }}</span><button v-if="player.queue.length > 1" class="text-button queue-clear" @click="player.clearUpcoming()">{{ t('player.clearQueue') }}</button></div></div><div class="queue-items"><div v-for="(item, index) in player.queue" :key="item.id" class="queue-row" :class="{ current: item.id === track.id }"><button class="queue-play" @click="player.play(item, player.queue)"><span>{{ index + 1 }}</span><strong :title="item.title">{{ item.title }}</strong><small :title="item.artist">{{ item.artist }}</small></button><button v-if="index !== player.currentIndex" class="queue-remove" :aria-label="t('player.removeFromQueue', { title: item.title })" @click="player.removeFromQueue(index)"><X :size="16" /></button></div></div></section>
  </section>
  <section v-else class="page empty-state"><p>{{ t('player.noPlayback') }}</p><button class="primary-button" @click="router.push('/playlists')">{{ t('player.browse') }}</button></section>
</template>
