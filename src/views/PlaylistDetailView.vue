<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibraryStore } from '@/stores/library'
import { usePlayerStore } from '@/stores/player'
import { useDownloadsStore } from '@/stores/downloads'
import { formatDuration } from '@/utils/formatDuration'
import { ArrowLeft, Check, Download, Play, Radio } from '@lucide/vue'
import { t } from '@/i18n'

const route = useRoute()
const router = useRouter()
const library = useLibraryStore()
const player = usePlayerStore()
const downloads = useDownloadsStore()
const playlist = computed(() => library.playlists.find((item) => item.id === route.params.id))
const canDownload = computed(() => !playlist.value?.tracks.some((track) => track.allowOfflineDownload === false))

onMounted(async () => {
  if (!library.playlists.length) await library.fetchPlaylists()
})

async function download() {
  if (playlist.value) await downloads.downloadPlaylist(playlist.value)
}

function play(index: number) {
  const current = playlist.value
  if (!current) return
  player.play(current.tracks[index], current.tracks)
  router.push('/now-playing')
}
</script>

<template>
  <section v-if="playlist" class="page playlist-detail">
    <button class="back-button" @click="router.push('/playlists')"><ArrowLeft :size="18" /> {{ t('common.backToLibrary') }}</button>
    <div class="playlist-hero"><img :src="playlist.coverUrl" alt="" /><div><p class="eyebrow">{{ t('playlist.label') }}</p><h1>{{ playlist.name }}</h1><p>{{ playlist.description || t('playlist.trackCount', { count: playlist.tracks.length }) }}</p><span>{{ t('playlist.trackDuration', { count: playlist.tracks.length, duration: formatDuration(playlist.tracks.reduce((total, track) => total + track.duration, 0)) }) }}</span></div></div>
    <div class="playlist-actions"><button class="primary-button" @click="play(0)"><Play :size="17" fill="currentColor" /> {{ t('playlist.playAll') }}</button><button v-if="canDownload" class="secondary-button" :disabled="downloads.taskFor(`playlist:${playlist.id}`)?.status === 'downloading'" @click="download"><Download :size="16" /> {{ downloads.taskFor(`playlist:${playlist.id}`)?.status === 'downloading' ? t('playlist.downloading', { completed: downloads.taskFor(`playlist:${playlist.id}`)?.completed || 0, total: playlist.tracks.length }) : t('playlist.download') }}</button><span v-else class="online-only">{{ t('playlist.onlineOnly') }}</span></div>
    <div class="track-list">
      <button v-for="(track, index) in playlist.tracks" :key="track.id" class="track-row" :class="{ current: player.currentTrack?.id === track.id }" @click="play(index)">
        <span class="track-number"><Radio v-if="player.currentTrack?.id === track.id && player.isPlaying" :size="15" />{{ player.currentTrack?.id === track.id && player.isPlaying ? '' : String(index + 1).padStart(2, '0') }}</span>
        <img :src="track.coverUrl" alt="" /><span class="track-copy"><strong>{{ track.title }}</strong><small>{{ track.artist }}</small></span><span class="track-actions"><button v-if="track.allowOfflineDownload !== false" class="download-icon" :aria-label="t('playlist.downloadTrack', { title: track.title })" :disabled="downloads.isDownloaded(track.id)" @click.stop="downloads.downloadSingle(track, playlist.id)"><Check v-if="downloads.isDownloaded(track.id)" :size="16" /><Download v-else :size="16" /></button><time>{{ formatDuration(track.duration) }}</time></span>
      </button>
    </div>
  </section>
  <section v-else class="page empty-state"><p>{{ t('playlist.notFound') }}</p><button class="primary-button" @click="router.push('/playlists')">{{ t('common.backToLibrary') }}</button></section>
</template>
