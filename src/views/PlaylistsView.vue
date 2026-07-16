<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLibraryStore } from '@/stores/library'
import { usePlayerStore } from '@/stores/player'
import { getProviderForSession } from '@/services/providers'
import { Download, Play, Settings } from '@lucide/vue'
import { t } from '@/i18n'
import CoverImage from '@/components/CoverImage.vue'

const router = useRouter()
const auth = useAuthStore()
const library = useLibraryStore()
const player = usePlayerStore()
const search = ref('')
const providerLabel = computed(() => auth.session ? getProviderForSession(auth.session).label : '')
const normalizedSearch = computed(() => search.value.trim().toLowerCase())
const recentTracks = computed(() => {
  const query = normalizedSearch.value
  const tracks = player.recentTracks.slice(0, 6)
  return query ? tracks.filter((track) => `${track.title} ${track.artist}`.toLowerCase().includes(query)) : tracks
})
const playlists = computed(() => {
  const query = normalizedSearch.value
  if (!query) return library.playlists
  return library.playlists.filter((playlist) => `${playlist.name} ${playlist.tracks.map((track) => `${track.title} ${track.artist}`).join(' ')}`.toLowerCase().includes(query))
})

function openDownloads() { router.push('/downloads') }

onMounted(() => library.fetchPlaylists())

function resume() {
  if (player.currentTrack) router.push('/now-playing')
}

function playRecent(trackId: string) {
  const track = player.recentTracks.find((item) => item.id === trackId)
  if (!track) return
  const playlist = library.playlists.find((item) => item.tracks.some((item) => item.id === track.id))
  player.play(track, playlist?.tracks ?? [track])
  router.push('/now-playing')
}
</script>

<template>
  <section class="page playlists-page" :aria-busy="library.loading">
    <header class="topbar"><div><p class="eyebrow">LM MUSIC</p><h1>{{ t('library.title') }}</h1></div><div class="header-actions"><button type="button" class="settings-button" :aria-label="t('common.downloads')" @click="openDownloads"><Download /></button><button type="button" class="settings-button" :aria-label="t('common.settings')" @click="router.push('/settings')"><Settings /></button></div></header>

    <button type="button" v-if="player.currentTrack" class="resume-card" :aria-label="t('library.resumeTrack', { title: player.currentTrack.title })" @click="resume">
      <CoverImage :src="player.currentTrack.coverUrl" alt="" />
      <span><small>{{ t('library.continue') }}</small><strong :title="player.currentTrack.title">{{ player.currentTrack.title }}</strong><em :title="player.currentTrack.artist">{{ player.currentTrack.artist }}</em></span><b><Play :size="15" fill="currentColor" /></b>
    </button>

    <label class="library-search"><span>{{ t('library.searchPlaceholder') }}</span><input v-model="search" type="search" :placeholder="t('library.searchPlaceholder')" /></label>

    <div v-if="recentTracks.length" class="section-heading"><h2>{{ t('library.recent') }}</h2></div>
    <div v-if="recentTracks.length" class="recent-tracks">
      <button type="button" v-for="track in recentTracks" :key="track.id" class="recent-track" :aria-current="player.currentTrack?.id === track.id ? 'true' : undefined" :aria-label="player.currentTrack?.id === track.id ? t('player.currentlyPlaying', { title: track.title }) : t('playlist.playTrack', { title: track.title })" @click="playRecent(track.id)">
        <CoverImage :src="track.coverUrl" alt="" /><span><strong :title="track.title">{{ track.title }}</strong><small :title="track.artist">{{ track.artist }}</small></span><Play :size="16" fill="currentColor" />
      </button>
    </div>

    <div class="section-heading"><h2>{{ auth.isConnected ? t('library.playlists', { provider: providerLabel }) : t('library.offlinePlaylists') }}</h2><span v-if="library.loading">{{ t('common.loading') }}</span></div>
    <p v-if="library.error" class="form-error" role="alert">{{ library.error }}</p>
    <div v-if="playlists.length" class="playlist-grid">
      <button type="button" v-for="playlist in playlists" :key="playlist.id" class="playlist-card" :aria-label="t('library.openPlaylist', { name: playlist.name })" @click="router.push(`/playlist/${playlist.id}`)">
        <CoverImage :src="playlist.coverUrl" alt="" />
        <span><strong :title="playlist.name">{{ playlist.name }}</strong><small>{{ t('library.trackCount', { count: playlist.tracks.length }) }}</small></span>
      </button>
    </div>
    <div v-else-if="!library.loading" class="empty-state"><p>{{ normalizedSearch ? t('library.noSearchResults') : auth.isConnected ? t('library.emptyConnected') : t('library.emptyDisconnected') }}</p><button type="button" v-if="!auth.isConnected && !normalizedSearch" class="primary-button" @click="router.push('/connect')">{{ t('library.connect') }}</button></div>

    <div v-if="!auth.isConnected && library.playlists.length" class="connect-note"><span>{{ t('library.offlineNotice') }}</span><button type="button" class="text-button" @click="router.push('/connect')">{{ t('library.connect') }}</button></div>
  </section>
</template>
