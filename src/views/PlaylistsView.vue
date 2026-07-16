<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLibraryStore } from '@/stores/library'
import { usePlayerStore } from '@/stores/player'

const router = useRouter()
const auth = useAuthStore()
const library = useLibraryStore()
const player = usePlayerStore()

function openDownloads() { router.push('/downloads') }

onMounted(() => library.fetchPlaylists())

function resume() {
  if (player.currentTrack) router.push('/now-playing')
}
</script>

<template>
  <section class="page playlists-page">
    <header class="topbar"><div><p class="eyebrow">LM MUSIC</p><h1>{{ auth.isConnected ? '你的歌单' : '本地演示' }}</h1></div><div class="header-actions"><button class="settings-button" aria-label="离线内容" @click="openDownloads">↓</button><button class="settings-button" aria-label="设置" @click="router.push('/settings')">⚙</button></div></header>

    <button v-if="player.currentTrack" class="resume-card" @click="resume">
      <img :src="player.currentTrack.coverUrl" alt="" />
      <span><small>继续收听</small><strong>{{ player.currentTrack.title }}</strong><em>{{ player.currentTrack.artist }}</em></span><b>▶</b>
    </button>

    <div class="section-heading"><h2>{{ auth.isConnected ? 'Jellyfin 歌单' : '示例歌单' }}</h2><span v-if="library.loading">同步中…</span></div>
    <p v-if="library.error" class="form-error">{{ library.error }}</p>
    <div v-if="library.playlists.length" class="playlist-grid">
      <button v-for="playlist in library.playlists" :key="playlist.id" class="playlist-card" @click="router.push(`/playlist/${playlist.id}`)">
        <img :src="playlist.coverUrl" alt="" />
        <span><strong>{{ playlist.name }}</strong><small>{{ playlist.tracks.length }} 首歌曲</small></span>
      </button>
    </div>
    <div v-else-if="!library.loading" class="empty-state">还没有可显示的音乐歌单。请在 Jellyfin 创建歌单后再试。</div>

    <div v-if="!auth.isConnected" class="connect-note"><span>已准备好连接你的个人音乐库</span><button class="text-button" @click="router.push('/connect')">连接 Jellyfin</button></div>
  </section>
</template>
