import { AudiusClient } from '@/services/audius/client'
import { JellyfinClient } from '@/services/jellyfin/client'
import { NavidromeClient } from '@/services/navidrome/client'
import type { LyricLine, MusicProviderType, MusicSession, Playlist } from '@/types/music'

export type ProviderCredentials = {
  serverUrl?: string
  username?: string
  password?: string
}

export type MusicProviderClient = {
  getPlaylists(): Promise<Playlist[]>
  getLyrics(trackId: string): Promise<LyricLine[]>
}

export type MusicProvider = {
  id: MusicProviderType
  label: string
  subtitle: string
  requiresCredentials: boolean
  supportsOfflineDownload: boolean
  connect(credentials?: ProviderCredentials): Promise<MusicSession>
  createClient(session: MusicSession): MusicProviderClient
}

const jellyfin: MusicProvider = {
  id: 'jellyfin',
  label: 'Jellyfin',
  subtitle: '个人媒体服务器',
  requiresCredentials: true,
  supportsOfflineDownload: true,
  async connect(credentials) {
    return JellyfinClient.login(credentials?.serverUrl ?? '', credentials?.username ?? '', credentials?.password ?? '')
  },
  createClient(session) {
    if (session.provider !== 'jellyfin') throw new Error('Jellyfin 会话无效。')
    return new JellyfinClient(session)
  },
}

const subsonic: MusicProvider = {
  id: 'subsonic',
  label: 'Navidrome',
  subtitle: '兼容 OpenSubsonic',
  requiresCredentials: true,
  supportsOfflineDownload: true,
  async connect(credentials) {
    return NavidromeClient.login(credentials?.serverUrl ?? '', credentials?.username ?? '', credentials?.password ?? '')
  },
  createClient(session) {
    if (session.provider !== 'subsonic') throw new Error('Navidrome 会话无效。')
    return new NavidromeClient(session)
  },
}

const audius: MusicProvider = {
  id: 'audius',
  label: 'Audius',
  subtitle: '公开音乐目录',
  requiresCredentials: false,
  supportsOfflineDownload: false,
  async connect() {
    return AudiusClient.connect()
  },
  createClient(session) {
    if (session.provider !== 'audius') throw new Error('Audius 会话无效。')
    return new AudiusClient()
  },
}

export const musicProviders = [jellyfin, subsonic, audius] as const

export function getMusicProvider(provider: MusicProviderType) {
  const definition = musicProviders.find((item) => item.id === provider)
  if (!definition) throw new Error(`不支持的音乐来源：${provider}`)
  return definition
}

export function getProviderForSession(session: MusicSession) {
  return getMusicProvider(session.provider)
}

export function sessionCacheId(session?: MusicSession | null) {
  if (!session) return 'offline'
  const identity = session.provider === 'jellyfin' ? session.userId : session.username
  return `${session.provider}::${session.serverUrl.replace(/\/$/, '')}::${identity}`
}
