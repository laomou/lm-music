<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getMusicProvider, getProviderSubtitle, musicProviders } from '@/services/providers'
import { useAuthStore } from '@/stores/auth'
import type { MusicProviderType } from '@/types/music'
import { ArrowLeft } from '@lucide/vue'
import { t } from '@/i18n'
import { useLocale } from '@/composables/useLocale'

const router = useRouter()
const auth = useAuthStore()
const serverUrl = ref('')
const username = ref('')
const password = ref('')
const rememberSession = ref(true)
const loading = ref(false)
const error = ref('')
const provider = ref<MusicProviderType>('jellyfin')
const appIconSrc = `${import.meta.env.BASE_URL}icon-192.png`
const language = useLocale()
const insecureServerUrl = computed(() => {
  const source = getMusicProvider(provider.value)
  return source.requiresCredentials && location.protocol === 'https:' && serverUrl.value.trim().toLowerCase().startsWith('http://')
})
const providerDescription = computed(() => provider.value === 'local' ? t('connect.localDescription') : t('connect.audiusDescription'))

async function connect() {
  loading.value = true
  error.value = ''
  try {
    const source = getMusicProvider(provider.value)
    if (source.requiresCredentials && location.protocol === 'https:' && serverUrl.value.trim().toLowerCase().startsWith('http://')) {
      throw new Error(t('connect.insecureServer'))
    }
    const session = await source.connect({ serverUrl: serverUrl.value, username: username.value, password: password.value })
    auth.saveSession(session, rememberSession.value)
    await router.push('/playlists')
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('common.connectFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="connect-page">
    <div class="connect-toolbar"><button type="button" v-if="auth.isConnected" class="back-button connect-back" @click="router.push('/playlists')"><ArrowLeft :size="18" /> {{ t('connect.back') }}</button><label class="locale-select"><span>{{ t('common.language') }}</span><select v-model="language"><option value="zh-CN">{{ t('common.chinese') }}</option><option value="en">{{ t('common.english') }}</option></select></label></div>
    <img class="brand-mark" :src="appIconSrc" alt="LM Music" />
    <p class="eyebrow">LM MUSIC</p>
    <h1 v-html="t('connect.title')" />
    <p class="muted">{{ t('connect.description') }}</p>
    <form class="connect-form" @submit.prevent="connect">
      <fieldset class="provider-picker"><legend>{{ t('connect.source') }}</legend><label v-for="source in musicProviders" :key="source.id" :class="{ selected: provider === source.id, 'audius-option': source.id === 'audius' }"><input v-model="provider" type="radio" :value="source.id" /><span><strong>{{ source.label }}</strong><small>{{ getProviderSubtitle(source) }}</small></span></label></fieldset>
      <template v-if="getMusicProvider(provider).requiresCredentials"><label>{{ t('connect.serverUrl') }}<input v-model.trim="serverUrl" required type="url" :placeholder="provider === 'jellyfin' ? 'https://jellyfin.example.com' : 'https://music.example.com'" /></label><label>{{ t('connect.username') }}<input v-model.trim="username" required autocomplete="username" :placeholder="t('connect.username')" /></label><label>{{ t('connect.password') }}<input v-model="password" required type="password" autocomplete="current-password" :placeholder="t('connect.password')" /></label><label class="remember-session"><input v-model="rememberSession" type="checkbox" /><span>{{ t('connect.rememberSession') }}</span></label><p class="credential-notice">{{ t('connect.credentialNotice') }}</p></template>
      <p v-else class="provider-description">{{ providerDescription }}</p>
      <p v-if="insecureServerUrl" class="form-error" role="alert">{{ t('connect.insecureServer') }}</p>
      <p v-else-if="error" class="form-error" role="alert">{{ error }}</p>
      <button type="submit" class="primary-button" :disabled="loading || insecureServerUrl">{{ loading ? t('connect.connecting') : provider === 'audius' ? t('connect.browseAudius') : provider === 'local' ? t('connect.openLocalFolder') : t('connect.connect', { provider: getMusicProvider(provider).label }) }}</button>
    </form>
  </section>
</template>
