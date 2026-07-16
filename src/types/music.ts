export type RepeatMode = 'off' | 'all' | 'one'

export type LyricLine = {
  time: number
  text: string
}

export type Track = {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  coverUrl?: string
  streamUrl: string
  lyrics: LyricLine[]
}

export type Playlist = {
  id: string
  name: string
  description?: string
  coverUrl?: string
  tracks: Track[]
}

export type JellyfinSession = {
  serverUrl: string
  accessToken: string
  userId: string
  username: string
}
