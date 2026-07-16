<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AudioPlayer from '@/components/AudioPlayer.vue'
import AppNotice from '@/components/AppNotice.vue'
import DownloadStatus from '@/components/DownloadStatus.vue'
import MiniPlayer from '@/components/MiniPlayer.vue'
import { usePlayerShortcuts } from '@/composables/usePlayerShortcuts'
import { locale, t } from '@/i18n'
import { usePlayerStore } from '@/stores/player'

const route = useRoute()
const player = usePlayerStore()
const isConnect = computed(() => route.path === '/connect')
usePlayerShortcuts()

watch([() => route.fullPath, () => player.currentTrack, locale], () => {
  if (player.currentTrack) {
    document.title = `${player.currentTrack.title} · ${player.currentTrack.artist} — LM Music`
    return
  }
  const titleKey = typeof route.meta.titleKey === 'string' ? route.meta.titleKey : ''
  document.title = titleKey ? `${t(titleKey)} — LM Music` : 'LM Music'
}, { immediate: true })
</script>

<template>
  <AudioPlayer />
  <a class="skip-link" href="#main-content">{{ t('common.skipToContent') }}</a>
  <main id="main-content" class="app-shell" :class="{ 'connect-shell': isConnect }" tabindex="-1">
    <RouterView />
  </main>
  <DownloadStatus v-if="!isConnect" />
  <MiniPlayer v-if="!isConnect" />
  <AppNotice />
</template>
