<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AudioPlayer from '@/components/AudioPlayer.vue'
import AppNotice from '@/components/AppNotice.vue'
import DownloadStatus from '@/components/DownloadStatus.vue'
import MiniPlayer from '@/components/MiniPlayer.vue'
import { usePlayerShortcuts } from '@/composables/usePlayerShortcuts'
import { t } from '@/i18n'

const route = useRoute()
const isConnect = computed(() => route.path === '/connect')
usePlayerShortcuts()
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
