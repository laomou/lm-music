import type { AudiusSession, Playlist, Track } from '@/types/music'
import { t } from '@/i18n'

const API_URL = 'https://api.audius.co/v1'

type AudiusArtwork = { '480x480'?: string; '1000x1000'?: string }
type AudiusTrack = {
  id: string
  title: string
  duration?: number
  is_streamable?: boolean
  artwork?: AudiusArtwork
  stream?: { url?: string }
  user?: { name?: string }
}

type AudiusPlaylist = {
  id: string
  playlist_name: string
  description?: string | null
  artwork?: AudiusArtwork
  tracks?: AudiusTrack[]
}

type ApiResponse<T> = { data: T }

export class AudiusClient {
  static async connect(): Promise<AudiusSession> {
    const response = await fetch(`${API_URL}/tracks/trending?limit=1`)
    if (!response.ok) throw new Error(t('error.audiusConnectFailed'))
    return { provider: 'audius', serverUrl: 'https://api.audius.co', username: 'Audius' }
  }

  async getPlaylists(): Promise<Playlist[]> {
    const [playlistResult, tracksResult] = await Promise.all([
      this.request<AudiusPlaylist[]>('/playlists/trending?limit=20'),
      this.request<AudiusTrack[]>('/tracks/trending?limit=30'),
    ])
    const playlists = playlistResult.map((playlist) => this.toPlaylist(playlist))
    const trendingTracks = tracksResult.map((track) => this.toTrack(track)).filter(Boolean) as Track[]
    return [{
      id: 'audius-trending-tracks',
      name: t('audius.trendingTracks'),
      description: t('audius.publicDescription'),
      coverUrl: trendingTracks[0]?.coverUrl,
      tracks: trendingTracks,
    }, ...playlists]
  }

  async getLyrics() {
    return []
  }

  async search(query: string): Promise<Track[]> {
    const results = await this.request<AudiusTrack[]>(`/tracks/search?query=${encodeURIComponent(query)}&limit=30`)
    return results.map((track) => this.toTrack(track)).filter(Boolean) as Track[]
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`)
    if (!response.ok) throw new Error(t('error.providerRequestFailed', { provider: 'Audius', status: response.status }))
    const body = await response.json() as ApiResponse<T>
    return body.data
  }

  private toPlaylist(playlist: AudiusPlaylist): Playlist {
    return {
      id: playlist.id,
      name: playlist.playlist_name,
      description: playlist.description ?? t('audius.publicDescription'),
      coverUrl: playlist.artwork?.['480x480'] ?? playlist.artwork?.['1000x1000'],
      tracks: (playlist.tracks ?? []).map((track) => this.toTrack(track)).filter(Boolean) as Track[],
    }
  }

  private toTrack(track: AudiusTrack): Track | null {
    if (!track.is_streamable) return null
    return {
      id: track.id,
      title: track.title,
      artist: track.user?.name ?? t('audius.creator'),
      duration: track.duration ?? 0,
      coverUrl: track.artwork?.['480x480'] ?? track.artwork?.['1000x1000'],
      // Ask Audius to resolve a fresh stream URL when playback begins. The
      // direct mirror URL returned in list responses is short-lived and some
      // mirrors reject browser media requests.
      streamUrl: `${API_URL}/tracks/${track.id}/stream`,
      lyrics: [],
      allowOfflineDownload: false,
    }
  }
}
