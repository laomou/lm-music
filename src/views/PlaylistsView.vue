<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLibraryStore } from '@/stores/library'
import { usePlayerStore } from '@/stores/player'
import { getProviderForSession } from '@/services/providers'
import { Download, Play, Settings } from '@lucide/vue'
import { t } from '@/i18n'

const router = useRouter()
const auth = useAuthStore()
const library = useLibraryStore()
const player = usePlayerStore()
const providerLabel = computed(() => auth.session ? getProviderForSession(auth.session).label : '')

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
  <section class="page playlists-page">
    <header class="topbar"><div><p class="eyebrow">LM MUSIC</p><h1>{{ t('library.title') }}</h1></div><div class="header-actions"><button class="settings-button" :aria-label="t('common.downloads')" @click="openDownloads"><Download /></button><button class="settings-button" :aria-label="t('common.settings')" @click="router.push('/settings')"><Settings /></button></div></header>

    <button v-if="player.currentTrack" class="resume-card" @click="resume">
      <img :src="player.currentTrack.coverUrl" alt="" />
      <span><small>{{ t('library.continue') }}</small><strong>{{ player.currentTrack.title }}</strong><em>{{ player.currentTrack.artist }}</em></span><b><Play :size="15" fill="currentColor" /></b>
    </button>

    <div v-if="player.recentTracks.length" class="section-heading"><h2>{{ t('library.recent') }}</h2></div>
    <div v-if="player.recentTracks.length" class="recent-tracks">
      <button v-for="track in player.recentTracks.slice(0, 6)" :key="track.id" class="recent-track" @click="playRecent(track.id)">
        <img :src="track.coverUrl" alt="" /><span><strong>{{ track.title }}</strong><small>{{ track.artist }}</small></span><Play :size="16" fill="currentColor" />
      </button>
    </div>

    <div class="section-heading"><h2>{{ auth.isConnected ? t('library.playlists', { provider: providerLabel }) : t('library.offlinePlaylists') }}</h2><span v-if="library.loading">{{ t('common.loading') }}</span></div>
    <p v-if="library.error" class="form-error">{{ library.error }}</p>
    <div v-if="library.playlists.length" class="playlist-grid">
      <button v-for="playlist in library.playlists" :key="playlist.id" class="playlist-card" @click="router.push(`/playlist/${playlist.id}`)">
        <img :src="playlist.coverUrl" alt="" />
        <span><strong>{{ playlist.name }}</strong><small>{{ t('library.trackCount', { count: playlist.tracks.length }) }}</small></span>
      </button>
    </div>
    <div v-else-if="!library.loading" class="empty-state"><p>{{ auth.isConnected ? t('library.emptyConnected') : t('library.emptyDisconnected') }}</p><button v-if="!auth.isConnected" class="primary-button" @click="router.push('/connect')">{{ t('library.connect') }}</button></div>

    <div v-if="!auth.isConnected && library.playlists.length" class="connect-note"><span>{{ t('library.offlineNotice') }}</span><button class="text-button" @click="router.push('/connect')">{{ t('library.connect') }}</button></div>
  </section>
</template>
