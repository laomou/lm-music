<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const auth = useAuthStore()
const app = useAppStore()

function disconnect() {
  auth.logout()
  router.push('/connect')
}
</script>

<template>
  <section class="page settings-page">
    <button class="back-button" @click="router.back()">← 返回</button>
    <p class="eyebrow">设置</p><h1>你的播放器</h1>
    <div class="settings-card"><small>JELLYFIN 服务器</small><strong>{{ auth.session?.serverUrl || '尚未连接' }}</strong><span>{{ auth.session?.username || '离线内容仅限此前已下载的歌曲' }}</span></div>
    <button class="settings-card settings-button-card" @click="router.push('/downloads')"><small>离线缓存</small><strong>管理已下载内容</strong><span>查看歌曲下载、存储占用并清除缓存。</span></button>
    <button v-if="app.canInstall" class="settings-card settings-button-card" @click="app.install()"><small>PWA 应用</small><strong>安装 LM Music</strong><span>添加到设备主屏幕或桌面，以独立应用形式打开。</span></button>
    <p v-if="app.serviceWorkerError" class="form-error">{{ app.serviceWorkerError }}</p>
    <button v-if="auth.isConnected" class="danger-button" @click="disconnect">断开 Jellyfin 连接</button>
    <button v-else class="primary-button" @click="router.push('/connect')">连接 Jellyfin</button>
  </section>
</template>
