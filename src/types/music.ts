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
  fallbackStreamUrl?: string
  lyrics: LyricLine[]
  allowOfflineDownload?: boolean
}

export type Playlist = {
  id: string
  name: string
  description?: string
  coverUrl?: string
  tracks: Track[]
}

export type LibraryCollectionType = 'album' | 'artist'

export type LibraryCollection = {
  id: string
  type: LibraryCollectionType
  name: string
  subtitle?: string
  coverUrl?: string
  tracks: Track[]
}

export type JellyfinSession = {
  provider: 'jellyfin'
  serverUrl: string
  accessToken: string
  userId: string
  username: string
}

export type SubsonicSession = {
  provider: 'subsonic'
  serverUrl: string
  username: string
  token: string
  salt: string
}

export type AudiusSession = {
  provider: 'audius'
  serverUrl: 'https://api.audius.co'
  username: 'Audius'
}

export type LocalFolderSession = {
  provider: 'local'
  serverUrl: 'local://folder'
  username: string
}

export type MusicSession = JellyfinSession | SubsonicSession | AudiusSession | LocalFolderSession
export type MusicProviderType = MusicSession['provider']
