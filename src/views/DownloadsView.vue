<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDownloadsStore } from '@/stores/downloads'
import { useLibraryStore } from '@/stores/library'
import type { Playlist, Track } from '@/types/music'
import { ArrowLeft, Check, Trash2, X } from '@lucide/vue'
import { formatBytes } from '@/utils/formatBytes'
import { t } from '@/i18n'

const router = useRouter()
const downloads = useDownloadsStore()
const library = useLibraryStore()
onMounted(() => downloads.refresh())

function sourceForTask(taskId: string): { playlist?: Playlist; track?: Track } {
  if (taskId.startsWith('playlist:')) return { playlist: library.playlists.find((item) => item.id === taskId.slice('playlist:'.length)) }
  const trackId = taskId.slice('track:'.length)
  const playlist = library.playlists.find((item) => item.tracks.some((track) => track.id === trackId))
  return { playlist, track: playlist?.tracks.find((track) => track.id === trackId) }
}
</script>

<template>
  <section class="page downloads-page">
    <button class="back-button" @click="router.push('/playlists')"><ArrowLeft :size="18" /> {{ t('common.backToLibrary') }}</button>
    <p class="eyebrow">{{ t('common.downloads') }}</p><h1>{{ t('downloads.title') }}</h1>
    <div class="storage-card"><div><small>{{ t('downloads.cache') }}</small><strong>{{ t('downloads.music', { size: formatBytes(downloads.totalBytes) }) }}</strong><span>{{ t('downloads.siteUsage', { size: formatBytes(downloads.storageUsage) }) }}</span></div><button v-if="downloads.tracks.length" class="danger-button" @click="downloads.clearAll()"><Trash2 :size="16" /> {{ t('downloads.clearAll') }}</button></div>
    <section v-if="downloads.tasks.length" class="tasks"><h2>{{ t('downloads.tasks') }}</h2><div v-for="task in downloads.tasks" :key="task.id" class="task-row"><span><strong>{{ task.label }}</strong><small>{{ task.status === 'downloading' ? t('downloads.downloading', { completed: task.completed, total: task.total }) : task.status === 'completed' ? t('downloads.completed') : task.status === 'cancelled' ? t('downloads.cancelled') : task.error }}</small></span><div class="task-actions"><button v-if="task.status === 'downloading'" class="notice-muted" @click="downloads.cancel(task.id)">{{ t('common.cancel') }}</button><button v-else-if="task.status === 'failed' || task.status === 'cancelled'" class="notice-muted" @click="downloads.retry(task, sourceForTask(task.id))">{{ t('common.retry') }}</button><b>{{ task.status === 'completed' ? '✓' : task.status === 'failed' ? '!' : task.status === 'cancelled' ? '—' : `${Math.round(task.completed / task.total * 100)}%` }}</b></div></div></section>
    <section class="downloaded-tracks"><h2>{{ t('downloads.songs') }}</h2><p v-if="!downloads.tracks.length" class="empty-copy">{{ t('downloads.empty') }}</p><div v-else class="track-list"><div v-for="track in downloads.tracks" :key="track.id" class="download-row"><span class="offline-badge"><Check :size="14" /></span><span class="track-copy"><strong>{{ track.title }}</strong><small>{{ track.artist }}</small></span><button class="download-icon" :aria-label="t('downloads.remove')" @click="downloads.remove(track)"><X :size="17" /></button></div></div></section>
  </section>
</template>
