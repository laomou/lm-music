import type { Playlist, Track } from '@/types/music'

const cover = (seed: string) => `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=900&q=85`
const audio = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'

const lyrics = [
  { time: 0, text: '城市灯光落在窗边' },
  { time: 8, text: '听见熟悉的旋律' },
  { time: 16, text: '我们穿过漫长时间' },
  { time: 24, text: '在夜色中缓缓前行' },
  { time: 32, text: '把所有喧嚣留在身后' },
]

const makeTrack = (id: string, title: string, artist: string, duration: number, coverUrl: string): Track => ({
  id,
  title,
  artist,
  album: '午夜电台',
  duration,
  coverUrl,
  streamUrl: audio,
  lyrics,
})

const nightCover = cover('photo-1514525253161-7a46d19cd819')
const cityCover = cover('photo-1492684223066-81342ee5ff30')
const rainCover = cover('photo-1518834107812-67b0b7c58434')

const nightTracks = [
  makeTrack('night-1', 'Midnight Drive', 'Nova Echo', 222, nightCover),
  makeTrack('night-2', 'City Lights', 'Nova Echo', 245, cityCover),
  makeTrack('night-3', 'Slow Motion', 'Lumen', 198, rainCover),
  makeTrack('night-4', 'After Rain', 'Lumen', 261, rainCover),
]

export const mockPlaylists: Playlist[] = [
  { id: 'night', name: '深夜播放', description: '留给夜晚和城市灯光的旋律', coverUrl: nightCover, tracks: nightTracks },
  { id: 'focus', name: '专注时刻', description: '安静地完成手边的事', coverUrl: cityCover, tracks: [...nightTracks].reverse() },
  { id: 'favorites', name: '喜欢的歌曲', description: '你最近标记的歌曲', coverUrl: rainCover, tracks: nightTracks.slice(0, 3) },
]
