export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return '00:00'
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remaining = (safeSeconds % 60).toString().padStart(2, '0')

  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${remaining}`
  return `${minutes}:${remaining}`
}
