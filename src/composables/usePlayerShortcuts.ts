import { onBeforeUnmount, onMounted } from 'vue'
import { usePlayerStore } from '@/stores/player'

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

export function usePlayerShortcuts() {
  const player = usePlayerStore()

  function handleKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return

    if (event.code === 'Space') {
      if (!player.currentTrack) return
      event.preventDefault()
      player.togglePlayback()
      return
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      if (!player.currentTrack) return
      event.preventDefault()
      const offset = event.key === 'ArrowLeft' ? -5 : 5
      player.setTime(Math.max(0, Math.min(player.duration || player.currentTrack.duration, player.currentTime + offset)))
    }
  }

  onMounted(() => window.addEventListener('keydown', handleKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
}
