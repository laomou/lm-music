<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDownloadsStore } from '@/stores/downloads'

const router = useRouter()
const downloads = useDownloadsStore()
const formattedBytes = computed(() => new Intl.NumberFormat('zh-CN', { notation: 'compact', style: 'unit', unit: 'byte', unitDisplay: 'narrow', maximumFractionDigits: 1 }).format(downloads.totalBytes))
const usage = computed(() => new Intl.NumberFormat('zh-CN', { notation: 'compact', style: 'unit', unit: 'byte', unitDisplay: 'narrow', maximumFractionDigits: 1 }).format(downloads.storageUsage))

onMounted(() => downloads.refresh())
</script>

<template>
  <section class="page downloads-page">
    <button class="back-button" @click="router.back()">← 返回</button>
    <p class="eyebrow">离线内容</p><h1>已下载</h1>
    <div class="storage-card"><div><small>浏览器缓存</small><strong>{{ formattedBytes }} 音乐</strong><span>站点已使用 {{ usage }}</span></div><button v-if="downloads.tracks.length" class="danger-button" @click="downloads.clearAll()">清除全部</button></div>
    <section v-if="downloads.tasks.length" class="tasks"><h2>下载任务</h2><div v-for="task in downloads.tasks" :key="task.id" class="task-row"><span><strong>{{ task.label }}</strong><small>{{ task.status === 'downloading' ? `正在下载 ${task.completed} / ${task.total}` : task.status === 'completed' ? '下载完成' : task.error }}</small></span><b>{{ task.status === 'completed' ? '✓' : task.status === 'failed' ? '!' : `${Math.round(task.completed / task.total * 100)}%` }}</b></div></section>
    <section class="downloaded-tracks"><h2>歌曲</h2><p v-if="!downloads.tracks.length" class="empty-copy">还没有离线歌曲。打开任意歌单后选择“下载歌单”。</p><div v-else class="track-list"><div v-for="track in downloads.tracks" :key="track.id" class="download-row"><span class="offline-badge">✓</span><span class="track-copy"><strong>{{ track.title }}</strong><small>{{ track.artist }}</small></span><button class="download-icon" aria-label="移除下载" @click="downloads.remove(track)">×</button></div></div></section>
  </section>
</template>
