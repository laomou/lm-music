<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { JellyfinClient } from '@/services/jellyfin/client'
import { NavidromeClient } from '@/services/navidrome/client'
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
    const session = provider.value === 'jellyfin'
      ? await JellyfinClient.login(serverUrl.value, username.value, password.value)
      : await NavidromeClient.login(serverUrl.value, username.value, password.value)
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
    <h1>连接你的<br />音乐库</h1>
    <p class="muted">支持 Jellyfin 和 Navidrome / OpenSubsonic。音乐始终保留在你的服务器中。</p>
    <form class="connect-form" @submit.prevent="connect">
      <fieldset class="provider-picker"><legend>音乐来源</legend><label :class="{ selected: provider === 'jellyfin' }"><input v-model="provider" type="radio" value="jellyfin" /><span><strong>Jellyfin</strong><small>个人媒体服务器</small></span></label><label :class="{ selected: provider === 'subsonic' }"><input v-model="provider" type="radio" value="subsonic" /><span><strong>Navidrome</strong><small>也兼容 OpenSubsonic</small></span></label></fieldset>
      <label>服务器地址<input v-model.trim="serverUrl" required type="url" :placeholder="provider === 'jellyfin' ? 'https://jellyfin.example.com' : 'https://music.example.com'" /></label>
      <label>用户名<input v-model.trim="username" required autocomplete="username" placeholder="你的用户名" /></label>
      <label>密码<input v-model="password" required type="password" autocomplete="current-password" placeholder="你的密码" /></label>
      <p v-if="error" class="form-error">{{ error }}</p>
      <button class="primary-button" :disabled="loading">{{ loading ? '正在连接…' : `连接 ${provider === 'jellyfin' ? 'Jellyfin' : 'Navidrome'}` }}</button>
    </form>
  </section>
</template>
