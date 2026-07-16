export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'

  const units = ['KB', 'MB', 'GB', 'TB']
  const kilobytes = Math.max(bytes / 1024, 1)
  const index = Math.min(Math.floor(Math.log(kilobytes) / Math.log(1024)), units.length - 1)
  const value = kilobytes / 1024 ** index
  const digits = index === 0 ? 0 : value < 10 ? 1 : 0

  return `${value.toFixed(digits)} ${units[index]}`
}
