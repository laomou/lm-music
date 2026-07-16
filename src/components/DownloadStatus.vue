<script setup lang="ts">
import { computed } from 'vue'
import { Check, Download, X } from '@lucide/vue'
import { useDownloadsStore } from '@/stores/downloads'
import { useRouter } from 'vue-router'
import { t } from '@/i18n'

const downloads = useDownloadsStore()
const router = useRouter()

const activeTask = computed(() => downloads.tasks.find((task) => task.status === 'downloading'))
const latestTask = computed(() => activeTask.value ?? downloads.tasks.at(-1))
const progress = computed(() => {
  const task = latestTask.value
  return task && task.total > 0 ? Math.round(task.completed / task.total * 100) : 0
})
const isComplete = computed(() => latestTask.value?.status === 'completed')
</script>

<template>
  <button
    v-if="latestTask"
    class="download-status"
    :class="{ complete: isComplete }"
    @click="router.push('/downloads')"
  >
    <span class="download-status-icon">
      <Check v-if="isComplete" :size="16" />
      <Download v-else :size="16" />
    </span>
    <span class="download-status-copy">
      <strong>{{ isComplete ? t('downloads.statusCompleted', { name: latestTask.label }) : t('downloads.statusDownloading', { name: latestTask.label }) }}</strong>
      <span class="download-status-progress"><i :style="{ width: `${progress}%` }" /></span>
      <small>{{ isComplete ? t('downloads.manage') : t('downloads.progress', { completed: latestTask.completed, total: latestTask.total, percent: progress }) }}</small>
    </span>
    <span v-if="latestTask.status === 'downloading'" class="download-status-cancel" role="button" :aria-label="t('downloads.cancelDownload')" @click.stop="downloads.cancel(latestTask.id)"><X :size="16" /></span>
  </button>
</template>
