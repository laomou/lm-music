<script setup lang="ts">
import { useAppStore } from '@/stores/app'

const app = useAppStore()
</script>

<template>
  <aside v-if="app.updateAvailable" class="app-notice" role="status">
    <span><strong>发现新版本</strong><small>更新不会中断当前播放，确认后将重新加载应用。</small></span>
    <div><button class="notice-muted" @click="app.updateAvailable = false">稍后</button><button class="notice-button" @click="app.applyUpdate()">更新</button></div>
  </aside>
  <aside v-else-if="app.offlineReady" class="app-notice compact" role="status">
    <span><strong>离线模式已准备好</strong><small>已下载的歌曲可在没有网络时播放。</small></span>
    <button class="notice-muted" @click="app.offlineReady = false">知道了</button>
  </aside>
</template>
