<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { getProviderForSession, getProviderSubtitle } from '@/services/providers'
import { computed } from 'vue'
import { ArrowLeft } from '@lucide/vue'
import { locale, setLocale, t, type Locale } from '@/i18n'

const router = useRouter()
const auth = useAuthStore()
const app = useAppStore()
const appVersion = __APP_VERSION__
const provider = computed(() => auth.session ? getProviderForSession(auth.session) : null)
const sourceLabel = computed(() => {
  if (!provider.value) return t('settings.source')
  return auth.session?.provider === 'audius'
    ? provider.value.label.toUpperCase()
    : `${provider.value.label.toUpperCase()} ${t('settings.server').toUpperCase()}`
})
const language = computed({
  get: () => locale.value,
  set: (value: Locale) => setLocale(value),
})

function disconnect() {
  if (!window.confirm(t('settings.confirmDisconnect'))) return
  auth.logout()
  router.push('/connect')
}
</script>

<template>
  <section class="page settings-page">
    <button type="button" class="back-button" @click="router.push('/playlists')"><ArrowLeft :size="18" /> {{ t('common.backToLibrary') }}</button>
    <p class="eyebrow">{{ t('common.settings') }}</p><h1>{{ t('settings.title') }}</h1>
    <div class="settings-card"><small>{{ sourceLabel }}</small><strong>{{ auth.session?.provider === 'audius' ? t('settings.publicCatalog') : auth.session?.serverUrl || t('settings.connect') }}</strong><span>{{ provider ? provider.supportsOfflineDownload ? t('settings.supportsOffline', { subtitle: getProviderSubtitle(provider) }) : t('settings.onlineOnly', { subtitle: getProviderSubtitle(provider) }) : t('settings.offlineOnly') }}</span></div>
    <label class="settings-card locale-settings"><small>{{ t('common.language') }}</small><select v-model="language"><option value="zh-CN">{{ t('common.chinese') }}</option><option value="en">{{ t('common.english') }}</option></select></label>
    <button type="button" class="settings-card settings-button-card" @click="router.push('/connect')"><small>{{ t('settings.source') }}</small><strong>{{ t('settings.switchSource') }}</strong><span>{{ t('settings.switchDescription') }}</span></button>
    <button type="button" class="settings-card settings-button-card" @click="router.push('/downloads')"><small>{{ t('settings.cache') }}</small><strong>{{ t('settings.manageCache') }}</strong><span>{{ t('settings.cacheDescription') }}</span></button>
    <button type="button" v-if="app.canInstall" class="settings-card settings-button-card" @click="app.install()"><small>PWA</small><strong>{{ t('settings.install') }}</strong><span>{{ t('settings.installDescription') }}</span></button>
    <div class="settings-card"><small>{{ t('settings.about') }}</small><strong>LM Music</strong><span>{{ t('settings.version', { version: appVersion }) }} · {{ t('settings.aboutDescription') }}</span></div>
    <p v-if="app.serviceWorkerError" class="form-error">{{ app.serviceWorkerError }}</p>
    <button type="button" v-if="auth.isConnected" class="danger-button" @click="disconnect">{{ t('settings.disconnect') }}</button>
    <button type="button" v-else class="primary-button" @click="router.push('/connect')">{{ t('settings.connect') }}</button>
  </section>
</template>
