import type { LyricLine } from '@/types/music'

export function parseLrc(value: string): LyricLine[] {
  const lines = value.split(/\r?\n/)
  const parsed: LyricLine[] = []
  for (const line of lines) {
    const matches = [...line.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)]
    const text = line.replace(/\[\d+:\d+(?:\.\d+)?\]/g, '').trim()
    for (const match of matches) parsed.push({ time: Number(match[1]) * 60 + Number(match[2]), text })
  }
  return parsed.sort((left, right) => left.time - right.time)
}
