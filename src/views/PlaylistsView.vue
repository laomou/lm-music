<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLibraryStore } from '@/stores/library'
import { usePlayerStore } from '@/stores/player'
import { getProviderForSession } from '@/services/providers'
import { Download, Play, Settings } from '@lucide/vue'

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
</script>

<template>
  <section class="page playlists-page">
    <header class="topbar"><div><p class="eyebrow">LM MUSIC</p><h1>你的歌单</h1></div><div class="header-actions"><button class="settings-button" aria-label="离线内容" @click="openDownloads"><Download /></button><button class="settings-button" aria-label="设置" @click="router.push('/settings')"><Settings /></button></div></header>

    <button v-if="player.currentTrack" class="resume-card" @click="resume">
      <img :src="player.currentTrack.coverUrl" alt="" />
      <span><small>继续收听</small><strong>{{ player.currentTrack.title }}</strong><em>{{ player.currentTrack.artist }}</em></span><b><Play :size="15" fill="currentColor" /></b>
    </button>

    <div class="section-heading"><h2>{{ auth.isConnected ? `${providerLabel}${auth.session?.provider === 'audius' ? ' 热门' : ''}歌单` : '已下载歌单' }}</h2><span v-if="library.loading">同步中…</span></div>
    <p v-if="library.error" class="form-error">{{ library.error }}</p>
    <div v-if="library.playlists.length" class="playlist-grid">
      <button v-for="playlist in library.playlists" :key="playlist.id" class="playlist-card" @click="router.push(`/playlist/${playlist.id}`)">
        <img :src="playlist.coverUrl" alt="" />
        <span><strong>{{ playlist.name }}</strong><small>{{ playlist.tracks.length }} 首歌曲</small></span>
      </button>
    </div>
    <div v-else-if="!library.loading" class="empty-state"><p>{{ auth.isConnected ? '还没有可显示的音乐歌单。请在你的音乐服务器创建歌单后再试。' : '尚未连接音乐服务器。' }}</p><button v-if="!auth.isConnected" class="primary-button" @click="router.push('/connect')">连接音乐库</button></div>

    <div v-if="!auth.isConnected && library.playlists.length" class="connect-note"><span>当前显示的是已缓存的离线内容</span><button class="text-button" @click="router.push('/connect')">连接音乐库</button></div>
  </section>
</template>
