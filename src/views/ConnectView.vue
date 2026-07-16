<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getMusicProvider, musicProviders } from '@/services/providers'
import { useAuthStore } from '@/stores/auth'
import type { MusicProviderType } from '@/types/music'

const router = useRouter()
const auth = useAuthStore()
const serverUrl = ref('')
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const provider = ref<MusicProviderType>('jellyfin')

async function connect() {
  loading.value = true
  error.value = ''
  try {
    const source = getMusicProvider(provider.value)
    const session = await source.connect({ serverUrl: serverUrl.value, username: username.value, password: password.value })
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
    <button v-if="auth.isConnected" class="back-button connect-back" @click="router.push('/playlists')">← 返回音乐库</button>
    <div class="brand-mark">♪</div>
    <p class="eyebrow">LM MUSIC</p>
    <h1>连接你的<br />音乐库</h1>
    <p class="muted">连接你的 Jellyfin 或 Navidrome 音乐库，或直接浏览 Audius 的公开音乐。</p>
    <form class="connect-form" @submit.prevent="connect">
      <fieldset class="provider-picker"><legend>音乐来源</legend><label v-for="source in musicProviders" :key="source.id" :class="{ selected: provider === source.id, 'audius-option': source.id === 'audius' }"><input v-model="provider" type="radio" :value="source.id" /><span><strong>{{ source.label }}</strong><small>{{ source.subtitle }}</small></span></label></fieldset>
      <template v-if="getMusicProvider(provider).requiresCredentials"><label>服务器地址<input v-model.trim="serverUrl" required type="url" :placeholder="provider === 'jellyfin' ? 'https://jellyfin.example.com' : 'https://music.example.com'" /></label><label>用户名<input v-model.trim="username" required autocomplete="username" placeholder="你的用户名" /></label><label>密码<input v-model="password" required type="password" autocomplete="current-password" placeholder="你的密码" /></label></template>
      <p v-else class="provider-description">无需账号即可浏览 Audius 热门公开音乐。Audius 内容仅支持在线播放，不提供离线下载。</p>
      <p v-if="error" class="form-error">{{ error }}</p>
      <button class="primary-button" :disabled="loading">{{ loading ? '正在连接…' : provider === 'audius' ? '浏览 Audius' : `连接 ${getMusicProvider(provider).label}` }}</button>
    </form>
  </section>
</template>
