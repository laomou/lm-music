<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Check, Download, ListPlus, Play, Radio } from '@lucide/vue'
import CoverImage from '@/components/CoverImage.vue'
import { t } from '@/i18n'
import { useDownloadsStore } from '@/stores/downloads'
import { useLibraryStore } from '@/stores/library'
import { usePlayerStore } from '@/stores/player'
import { formatDuration } from '@/utils/formatDuration'
import type { Track } from '@/types/music'

const route = useRoute()
const router = useRouter()
const library = useLibraryStore()
const player = usePlayerStore()
const downloads = useDownloadsStore()
const collection = computed(() => library.collectionById(String(route.params.id)))
const canDownload = computed(() => !collection.value?.tracks.some((track) => track.allowOfflineDownload === false))
const queuedTrackId = ref('')

function play(index: number) {
  const current = collection.value
  if (!current?.tracks[index]) return
  player.play(current.tracks[index], current.tracks)
  router.push('/now-playing')
}

function addToQueue(track: Track) {
  player.addToQueue(track)
  queuedTrackId.value = track.id
  window.setTimeout(() => { if (queuedTrackId.value === track.id) queuedTrackId.value = '' }, 1600)
}

async function download() {
  const current = collection.value
  if (!current?.tracks.length) return
  await downloads.downloadPlaylist({ id: current.id, name: current.name, coverUrl: current.coverUrl, tracks: current.tracks })
}
</script>

<template>
  <section v-if="collection" class="page playlist-detail">
    <button type="button" class="back-button" @click="router.push('/playlists')"><ArrowLeft :size="18" /> {{ t('common.backToLibrary') }}</button>
    <div class="playlist-hero"><CoverImage :src="collection.coverUrl" alt="" /><div><p class="eyebrow">{{ collection.type === 'album' ? t('library.albumTab') : t('library.artistTab') }}</p><h1>{{ collection.name }}</h1><p>{{ collection.subtitle || t('library.trackCount', { count: collection.tracks.length }) }}</p><span>{{ t('playlist.trackDuration', { count: collection.tracks.length, duration: formatDuration(collection.tracks.reduce((total, track) => total + track.duration, 0)) }) }}</span></div></div>
    <p v-if="downloads.error" class="form-error" role="alert">{{ downloads.error }}</p>
    <div class="playlist-actions"><button type="button" class="primary-button" :disabled="!collection.tracks.length" @click="play(0)"><Play :size="17" fill="currentColor" /> {{ t('playlist.playAll') }}</button><button type="button" v-if="canDownload" class="secondary-button" :disabled="!collection.tracks.length || downloads.taskFor(`playlist:${collection.id}`)?.status === 'downloading'" @click="download"><Download :size="16" /> {{ downloads.taskFor(`playlist:${collection.id}`)?.status === 'downloading' ? t('playlist.downloading', { completed: downloads.taskFor(`playlist:${collection.id}`)?.completed || 0, total: collection.tracks.length }) : t('playlist.download') }}</button><span v-else class="online-only">{{ t('playlist.onlineOnly') }}</span></div>
    <div class="track-list">
      <div v-for="(track, index) in collection.tracks" :key="track.id" class="track-row" :class="{ current: player.currentTrack?.id === track.id }">
        <button type="button" class="track-play" :aria-label="player.currentTrack?.id === track.id ? t('player.currentlyPlaying', { title: track.title }) : t('playlist.playTrack', { title: track.title })" @click="play(index)">
          <span class="track-number"><Radio v-if="player.currentTrack?.id === track.id && player.isPlaying" :size="15" />{{ player.currentTrack?.id === track.id && player.isPlaying ? '' : String(index + 1).padStart(2, '0') }}</span>
          <CoverImage :src="track.coverUrl" alt="" /><span class="track-copy"><strong :title="track.title">{{ track.title }}</strong><small :title="track.artist">{{ track.artist }}</small></span>
        </button>
        <span class="track-actions"><button type="button" class="download-icon" :aria-label="queuedTrackId === track.id ? t('player.addedToQueue', { title: track.title }) : t('player.addToQueue', { title: track.title })" @click="addToQueue(track)"><Check v-if="queuedTrackId === track.id" :size="16" /><ListPlus v-else :size="16" /></button><button type="button" v-if="track.allowOfflineDownload !== false" class="download-icon" :aria-label="downloads.isDownloaded(track.id) ? t('playlist.downloadedTrack', { title: track.title }) : t('playlist.downloadTrack', { title: track.title })" :disabled="downloads.isDownloaded(track.id)" @click="downloads.downloadSingle(track, collection.id)"><Check v-if="downloads.isDownloaded(track.id)" :size="16" /><Download v-else :size="16" /></button><time>{{ formatDuration(track.duration) }}</time></span>
      </div>
    </div>
  </section>
  <section v-else class="page empty-state"><p>{{ t('collection.notFound') }}</p><button type="button" class="primary-button" @click="router.push('/playlists')">{{ t('common.backToLibrary') }}</button></section>
</template>
