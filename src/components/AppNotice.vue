<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useDownloadsStore } from '@/stores/downloads'
import { t } from '@/i18n'

const app = useAppStore()
const downloads = useDownloadsStore()
const hasDownloadStatus = computed(() => Boolean(downloads.tasks.find((task) => task.status === 'downloading') ?? downloads.tasks.at(-1)))
</script>

<template>
  <aside v-if="app.updateAvailable" class="app-notice" :class="{ 'with-download': hasDownloadStatus }" role="status">
    <span><strong>{{ t('notice.updateTitle') }}</strong><small>{{ t('notice.updateDescription') }}</small></span>
    <div><button type="button" class="notice-muted" @click="app.updateAvailable = false">{{ t('notice.later') }}</button><button type="button" class="notice-button" @click="app.applyUpdate()">{{ t('notice.update') }}</button></div>
  </aside>
  <aside v-else-if="app.offlineReady" class="app-notice compact" :class="{ 'with-download': hasDownloadStatus }" role="status">
    <span><strong>{{ t('notice.offlineReady') }}</strong><small>{{ t('notice.offlineReadyDescription') }}</small></span>
    <button type="button" class="notice-muted" @click="app.offlineReady = false">{{ t('notice.gotIt') }}</button>
  </aside>
  <aside v-else-if="app.isOffline" class="app-notice compact" :class="{ 'with-download': hasDownloadStatus }" role="status">
    <span><strong>{{ t('notice.offlineTitle') }}</strong><small>{{ t('notice.offlineDescription') }}</small></span>
  </aside>
</template>
