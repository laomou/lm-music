<script setup lang="ts">
withDefaults(defineProps<{
  src?: string
  alt?: string
}>(), {
  src: '',
  alt: '',
})

const fallbackSrc = `${import.meta.env.BASE_URL}favicon.svg`

function useFallback(event: Event) {
  const image = event.currentTarget as HTMLImageElement
  if (image.src.endsWith('/favicon.svg')) return
  image.src = fallbackSrc
}
</script>

<template>
  <img :src="src || fallbackSrc" :alt="alt" @error="useFallback" />
</template>
