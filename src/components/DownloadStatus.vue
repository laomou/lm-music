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
  if (!task || task.total <= 0) return 0
  const fileProgress = task.totalBytes > 0 ? Math.min(task.receivedBytes / task.totalBytes, 1) : 0
  return Math.round(Math.min((task.completed + fileProgress) / task.total, 1) * 100)
})
const isComplete = computed(() => latestTask.value?.status === 'completed')
</script>

<template>
  <aside
    v-if="latestTask"
    class="download-status"
    :class="{ complete: isComplete }"
    aria-live="polite"
  >
    <button type="button" class="download-status-open" @click="router.push('/downloads')">
      <span class="download-status-icon">
        <Check v-if="isComplete" :size="16" />
        <Download v-else :size="16" />
      </span>
      <span class="download-status-copy">
        <strong>{{ isComplete ? t('downloads.statusCompleted', { name: latestTask.label }) : t('downloads.statusDownloading', { name: latestTask.label }) }}</strong>
        <span
          class="download-status-progress"
          role="progressbar"
          :aria-valuemin="0"
          :aria-valuemax="100"
          :aria-valuenow="progress"
        ><i :style="{ width: `${progress}%` }" /></span>
        <small>{{ isComplete ? t('downloads.manage') : t('downloads.progress', { completed: latestTask.completed, total: latestTask.total, percent: progress }) }}</small>
      </span>
    </button>
    <button type="button" v-if="latestTask.status === 'downloading'" class="download-status-cancel" :aria-label="t('downloads.cancelDownload')" @click="downloads.cancel(latestTask.id)"><X :size="16" /></button>
    <button type="button" v-else class="download-status-cancel" :aria-label="t('downloads.dismissStatus')" @click="downloads.dismissTask(latestTask.id)"><X :size="16" /></button>
  </aside>
</template>
