import { AudiusClient } from '@/services/audius/client'
import { JellyfinClient } from '@/services/jellyfin/client'
import { LocalFolderClient } from '@/services/local/client'
import { NavidromeClient } from '@/services/navidrome/client'
import type { LyricLine, MusicProviderType, MusicSession, Playlist, Track } from '@/types/music'
import { t } from '@/i18n'

type ProviderCredentials = {
  serverUrl?: string
  username?: string
  password?: string
}

export type PlaylistLoadOptions = {
  signal?: AbortSignal
  onProgress?: (scannedFiles: number) => void
}

type MusicProviderClient = {
  getPlaylists(options?: PlaylistLoadOptions): Promise<Playlist[]>
  getLyrics(trackId: string): Promise<LyricLine[]>
  search?(query: string): Promise<Track[]>
}

export type MusicProvider = {
  id: MusicProviderType
  label: string
  subtitleKey: string
  requiresCredentials: boolean
  supportsOfflineDownload: boolean
  connect(credentials?: ProviderCredentials): Promise<MusicSession>
  createClient(session: MusicSession): MusicProviderClient
}

const jellyfin: MusicProvider = {
  id: 'jellyfin',
  label: 'Jellyfin',
  subtitleKey: 'provider.jellyfinSubtitle',
  requiresCredentials: true,
  supportsOfflineDownload: true,
  async connect(credentials) {
    return JellyfinClient.login(credentials?.serverUrl ?? '', credentials?.username ?? '', credentials?.password ?? '')
  },
  createClient(session) {
    if (session.provider !== 'jellyfin') throw new Error(t('provider.invalidSession', { provider: 'Jellyfin' }))
    return new JellyfinClient(session)
  },
}

const subsonic: MusicProvider = {
  id: 'subsonic',
  label: 'Navidrome',
  subtitleKey: 'provider.navidromeSubtitle',
  requiresCredentials: true,
  supportsOfflineDownload: true,
  async connect(credentials) {
    return NavidromeClient.login(credentials?.serverUrl ?? '', credentials?.username ?? '', credentials?.password ?? '')
  },
  createClient(session) {
    if (session.provider !== 'subsonic') throw new Error(t('provider.invalidSession', { provider: 'Navidrome' }))
    return new NavidromeClient(session)
  },
}

const audius: MusicProvider = {
  id: 'audius',
  label: 'Audius',
  subtitleKey: 'provider.audiusSubtitle',
  requiresCredentials: false,
  supportsOfflineDownload: false,
  async connect() {
    return AudiusClient.connect()
  },
  createClient(session) {
    if (session.provider !== 'audius') throw new Error(t('provider.invalidSession', { provider: 'Audius' }))
    return new AudiusClient()
  },
}

const local: MusicProvider = {
  id: 'local',
  label: 'Local Folder',
  subtitleKey: 'provider.localSubtitle',
  requiresCredentials: false,
  supportsOfflineDownload: false,
  async connect() {
    return LocalFolderClient.connect()
  },
  createClient(session) {
    if (session.provider !== 'local') throw new Error(t('provider.invalidSession', { provider: 'Local Folder' }))
    return new LocalFolderClient()
  },
}

export const musicProviders = [jellyfin, subsonic, audius, local] as const

export function getMusicProvider(provider: MusicProviderType) {
  const definition = musicProviders.find((item) => item.id === provider)
  if (!definition) throw new Error(t('provider.unsupported', { provider }))
  return definition
}

export function getProviderSubtitle(provider: MusicProvider) {
  return t(provider.subtitleKey)
}

export function getProviderForSession(session: MusicSession) {
  return getMusicProvider(session.provider)
}

export function sessionCacheId(session?: MusicSession | null) {
  if (!session) return 'offline'
  const identity = session.provider === 'jellyfin' ? session.userId : session.username
  return `${session.provider}::${session.serverUrl.replace(/\/$/, '')}::${identity}`
}
