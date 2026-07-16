<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { LyricLine } from '@/types/music'

const props = defineProps<{ lines: LyricLine[]; currentTime: number }>()
const emit = defineEmits<{ seek: [time: number] }>()
const container = ref<HTMLElement | null>(null)
const activeIndex = computed(() => {
  for (let index = props.lines.length - 1; index >= 0; index -= 1) {
    if (props.currentTime >= props.lines[index].time) return index
  }
  return -1
})

watch(activeIndex, async (index) => {
  if (index < 0 || !container.value) return
  await nextTick()
  const element = container.value.querySelector<HTMLElement>(`[data-index="${index}"]`)
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
})
</script>

<template>
  <section class="lyrics-panel" aria-label="同步歌词">
    <p class="section-label">歌词</p>
    <div v-if="lines.length" ref="container" class="lyrics-scroll">
      <button
        v-for="(line, index) in lines"
        :key="`${line.time}-${index}`"
        class="lyric-line"
        :class="{ active: index === activeIndex }"
        :data-index="index"
        @click="emit('seek', line.time)"
      >
        {{ line.text || '♪' }}
      </button>
    </div>
    <p v-else class="empty-lyrics">暂无同步歌词</p>
  </section>
</template>
