<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDownloadsStore } from '@/stores/downloads'
import { useLibraryStore } from '@/stores/library'
import type { Playlist, Track } from '@/types/music'
import { ArrowLeft, Check, Trash2, X } from '@lucide/vue'
import { formatBytes } from '@/utils/formatBytes'

const router = useRouter()
const downloads = useDownloadsStore()
const library = useLibraryStore()
onMounted(() => downloads.refresh())

function sourceForTask(taskId: string): { playlist?: Playlist; track?: Track } {
  if (taskId.startsWith('playlist:')) return { playlist: library.playlists.find((item) => item.id === taskId.slice('playlist:'.length)) }
  const trackId = taskId.slice('track:'.length)
  return { track: library.playlists.flatMap((playlist) => playlist.tracks).find((item) => item.id === trackId) }
}
</script>

<template>
  <section class="page downloads-page">
    <button class="back-button" @click="router.push('/playlists')"><ArrowLeft :size="18" /> 返回歌单</button>
    <p class="eyebrow">离线内容</p><h1>已下载</h1>
    <div class="storage-card"><div><small>浏览器缓存</small><strong>{{ formatBytes(downloads.totalBytes) }} 音乐</strong><span>站点已使用 {{ formatBytes(downloads.storageUsage) }}</span></div><button v-if="downloads.tracks.length" class="danger-button" @click="downloads.clearAll()"><Trash2 :size="16" /> 清除全部</button></div>
    <section v-if="downloads.tasks.length" class="tasks"><h2>下载任务</h2><div v-for="task in downloads.tasks" :key="task.id" class="task-row"><span><strong>{{ task.label }}</strong><small>{{ task.status === 'downloading' ? `正在下载 ${task.completed} / ${task.total}` : task.status === 'completed' ? '下载完成' : task.status === 'cancelled' ? '下载已取消' : task.error }}</small></span><div class="task-actions"><button v-if="task.status === 'downloading'" class="notice-muted" @click="downloads.cancel(task.id)">取消</button><button v-else-if="task.status === 'failed' || task.status === 'cancelled'" class="notice-muted" @click="downloads.retry(task, sourceForTask(task.id).playlist, sourceForTask(task.id).track)">重试</button><b>{{ task.status === 'completed' ? '✓' : task.status === 'failed' ? '!' : task.status === 'cancelled' ? '—' : `${Math.round(task.completed / task.total * 100)}%` }}</b></div></div></section>
    <section class="downloaded-tracks"><h2>歌曲</h2><p v-if="!downloads.tracks.length" class="empty-copy">还没有离线歌曲。打开任意歌单后选择“下载歌单”。</p><div v-else class="track-list"><div v-for="track in downloads.tracks" :key="track.id" class="download-row"><span class="offline-badge"><Check :size="14" /></span><span class="track-copy"><strong>{{ track.title }}</strong><small>{{ track.artist }}</small></span><button class="download-icon" aria-label="移除下载" @click="downloads.remove(track)"><X :size="17" /></button></div></div></section>
  </section>
</template>
