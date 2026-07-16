<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AudioPlayer from '@/components/AudioPlayer.vue'
import MiniPlayer from '@/components/MiniPlayer.vue'

const route = useRoute()
const isConnect = computed(() => route.path === '/connect')
</script>

<template>
  <AudioPlayer />
  <main class="app-shell" :class="{ 'connect-shell': isConnect }">
    <RouterView />
  </main>
  <MiniPlayer v-if="!isConnect" />
</template>
