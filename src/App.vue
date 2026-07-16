<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AudioPlayer from '@/components/AudioPlayer.vue'
import AppNotice from '@/components/AppNotice.vue'
import DownloadStatus from '@/components/DownloadStatus.vue'
import MiniPlayer from '@/components/MiniPlayer.vue'
import { usePlayerShortcuts } from '@/composables/usePlayerShortcuts'

const route = useRoute()
const isConnect = computed(() => route.path === '/connect')
usePlayerShortcuts()
</script>

<template>
  <AudioPlayer />
  <main class="app-shell" :class="{ 'connect-shell': isConnect }">
    <RouterView />
  </main>
  <DownloadStatus v-if="!isConnect" />
  <MiniPlayer v-if="!isConnect" />
  <AppNotice />
</template>
