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
const viewMode = ref<'playlists' | 'albums' | 'artists'>('playlists')
const providerLabel = computed(() => auth.session ? getProviderForSession(auth.session).label : '')
const showCollections = computed(() => auth.session?.provider !== 'audius' && (library.albums.length > 0 || library.artists.length > 0))
const normalizedSearch = computed(() => search.value.trim().toLowerCase())
const recentTracks = computed(() => {
  const query = normalizedSearch.value
  const tracks = player.recentTracks.slice(0, 6)
  return query ? tracks.filter((track) => `${track.title} ${track.artist}`.toLowerCase().includes(query)) : tracks
})
const favoriteTracks = computed(() => {
  const query = normalizedSearch.value
  const tracks = player.favoriteTracks
  return query ? tracks.filter((track) => `${track.title} ${track.artist}`.toLowerCase().includes(query)) : tracks
})
const playlists = computed(() => {
  const query = normalizedSearch.value
  if (!query) return library.playlists
  return library.playlists.filter((playlist) => `${playlist.name} ${playlist.tracks.map((track) => `${track.title} ${track.artist}`).join(' ')}`.toLowerCase().includes(query))
})
const albums = computed(() => {
  const query = normalizedSearch.value
  return query ? library.albums.filter((album) => `${album.name} ${album.subtitle ?? ''}`.toLowerCase().includes(query)) : library.albums
})
const artists = computed(() => {
  const query = normalizedSearch.value
  return query ? library.artists.filter((artist) => artist.name.toLowerCase().includes(query)) : library.artists
})

function openDownloads() { router.push('/downloads') }

onMounted(() => library.fetchPlaylists())

function resume() {
  if (player.currentTrack) router.push('/now-playing')
}

function playRecent(trackId: string) {
  const track = [...player.recentTracks, ...player.favoriteTracks].find((item) => item.id === trackId)
  if (!track) return
  const playlist = library.playlists.find((item) => item.tracks.some((item) => item.id === track.id))
  player.play(track, playlist?.tracks ?? [track])
  router.push('/now-playing')
}

function playCollection(tracks: typeof library.allTracks) {
  if (!tracks.length) return
  player.play(tracks[0], tracks)
  router.push('/now-playing')
}

function openCollection(id: string) {
  router.push(`/collection/${id}`)
}

function clearRecent() {
  if (window.confirm(t('library.confirmClearRecent'))) player.clearRecentTracks()
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

    <div v-if="showCollections" class="library-tabs" role="tablist" :aria-label="t('library.title')">
      <button type="button" role="tab" :aria-selected="viewMode === 'playlists'" :class="{ active: viewMode === 'playlists' }" @click="viewMode = 'playlists'">{{ t('library.playlistTab') }}</button>
      <button type="button" role="tab" :aria-selected="viewMode === 'albums'" :class="{ active: viewMode === 'albums' }" @click="viewMode = 'albums'">{{ t('library.albumTab') }}</button>
      <button type="button" role="tab" :aria-selected="viewMode === 'artists'" :class="{ active: viewMode === 'artists' }" @click="viewMode = 'artists'">{{ t('library.artistTab') }}</button>
    </div>

    <div v-if="favoriteTracks.length" class="section-heading"><h2>{{ t('library.favorites') }}</h2></div>
    <div v-if="favoriteTracks.length" class="recent-tracks">
      <button type="button" v-for="track in favoriteTracks" :key="track.id" class="recent-track" :aria-current="player.currentTrack?.id === track.id ? 'true' : undefined" :aria-label="player.currentTrack?.id === track.id ? t('player.currentlyPlaying', { title: track.title }) : t('playlist.playTrack', { title: track.title })" @click="playRecent(track.id)">
        <CoverImage :src="track.coverUrl" alt="" /><span><strong :title="track.title">{{ track.title }}</strong><small :title="track.artist">{{ track.artist }}</small></span><Play :size="16" fill="currentColor" />
      </button>
    </div>

    <div v-if="recentTracks.length" class="section-heading"><h2>{{ t('library.recent') }}</h2><button type="button" class="text-button" @click="clearRecent">{{ t('library.clearRecent') }}</button></div>
    <div v-if="recentTracks.length" class="recent-tracks">
      <button type="button" v-for="track in recentTracks" :key="track.id" class="recent-track" :aria-current="player.currentTrack?.id === track.id ? 'true' : undefined" :aria-label="player.currentTrack?.id === track.id ? t('player.currentlyPlaying', { title: track.title }) : t('playlist.playTrack', { title: track.title })" @click="playRecent(track.id)">
        <CoverImage :src="track.coverUrl" alt="" /><span><strong :title="track.title">{{ track.title }}</strong><small :title="track.artist">{{ track.artist }}</small></span><Play :size="16" fill="currentColor" />
      </button>
    </div>

    <div class="section-heading"><h2>{{ viewMode === 'albums' ? t('library.albumTab') : viewMode === 'artists' ? t('library.artistTab') : auth.isConnected ? t('library.playlists', { provider: providerLabel }) : t('library.offlinePlaylists') }}</h2><span v-if="library.loading">{{ t('common.loading') }}</span></div>
    <p v-if="library.error" class="form-error" role="alert">{{ library.error }}</p>
    <div v-if="viewMode === 'playlists' && playlists.length" class="playlist-grid">
      <button type="button" v-for="playlist in playlists" :key="playlist.id" class="playlist-card" :aria-label="t('library.openPlaylist', { name: playlist.name })" @click="router.push(`/playlist/${playlist.id}`)">
        <CoverImage :src="playlist.coverUrl" alt="" />
        <span><strong :title="playlist.name">{{ playlist.name }}</strong><small>{{ t('library.trackCount', { count: playlist.tracks.length }) }}</small></span>
      </button>
    </div>
    <div v-else-if="viewMode === 'albums' && albums.length" class="playlist-grid">
      <button type="button" v-for="album in albums" :key="album.id" class="playlist-card" :aria-label="t('library.openAlbum', { name: album.name })" @click="openCollection(album.id)">
        <CoverImage :src="album.coverUrl" alt="" />
        <span><strong :title="album.name">{{ album.name }}</strong><small>{{ album.subtitle }} · {{ t('library.trackCount', { count: album.tracks.length }) }}</small></span>
      </button>
    </div>
    <div v-else-if="viewMode === 'artists' && artists.length" class="playlist-grid">
      <button type="button" v-for="artist in artists" :key="artist.id" class="playlist-card" :aria-label="t('library.openArtist', { name: artist.name })" @click="openCollection(artist.id)">
        <CoverImage :src="artist.coverUrl" alt="" />
        <span><strong :title="artist.name">{{ artist.name }}</strong><small>{{ t('library.trackCount', { count: artist.tracks.length }) }}</small></span>
      </button>
    </div>
    <div v-else-if="!library.loading" class="empty-state"><p>{{ normalizedSearch ? t('library.noSearchResults') : auth.isConnected ? t('library.emptyConnected') : t('library.emptyDisconnected') }}</p><button type="button" v-if="!auth.isConnected && !normalizedSearch" class="primary-button" @click="router.push('/connect')">{{ t('library.connect') }}</button></div>

    <div v-if="!auth.isConnected && library.playlists.length" class="connect-note"><span>{{ t('library.offlineNotice') }}</span><button type="button" class="text-button" @click="router.push('/connect')">{{ t('library.connect') }}</button></div>
  </section>
</template>
