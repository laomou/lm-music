<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { JellyfinClient } from '@/services/jellyfin/client'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const serverUrl = ref('')
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function connect() {
  loading.value = true
  error.value = ''
  try {
    const session = await JellyfinClient.login(serverUrl.value, username.value, password.value)
    auth.saveSession(session)
    await router.push('/playlists')
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '连接失败，请重试。'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="connect-page">
    <div class="brand-mark">♪</div>
    <p class="eyebrow">LM MUSIC</p>
    <h1>连接你的<br />Jellyfin 音乐库</h1>
    <p class="muted">音乐始终保留在你的服务器中。LM Music 只负责播放、歌词和离线缓存。</p>
    <form class="connect-form" @submit.prevent="connect">
      <label>服务器地址<input v-model.trim="serverUrl" required type="url" placeholder="https://jellyfin.example.com" /></label>
      <label>用户名<input v-model.trim="username" required autocomplete="username" placeholder="你的用户名" /></label>
      <label>密码<input v-model="password" required type="password" autocomplete="current-password" placeholder="你的密码" /></label>
      <p v-if="error" class="form-error">{{ error }}</p>
      <button class="primary-button" :disabled="loading">{{ loading ? '正在连接…' : '连接 Jellyfin' }}</button>
    </form>
    <button class="text-button" @click="router.push('/playlists')">先体验本地演示</button>
  </section>
</template>
