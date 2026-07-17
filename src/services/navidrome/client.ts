import type { LyricLine, Playlist, SubsonicSession, Track } from '@/types/music'
import { t } from '@/i18n'
import { parseLrc } from '@/utils/parseLrc'

type SubsonicResponse<T> = {
  'subsonic-response': T & { status: 'ok' | 'failed'; error?: { message?: string } }
}

type SubsonicSong = {
  id: string
  title: string
  artist?: string
  album?: string
  duration?: number
  coverArt?: string
}

type SubsonicPlaylist = {
  id: string
  name: string
  coverArt?: string
}

type SubsonicLyrics = {
  value?: string
  syncedLyrics?: Array<{ start: number; value: string }>
}

function encodePassword(password: string) {
  return `enc:${Array.from(new TextEncoder().encode(password)).map((byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

export class NavidromeClient {
  constructor(private readonly session: SubsonicSession) {}

  static async login(serverUrl: string, username: string, password: string): Promise<SubsonicSession> {
    const session: SubsonicSession = { provider: 'subsonic', serverUrl: serverUrl.replace(/\/$/, ''), username, password }
    const client = new NavidromeClient(session)
    await client.request('ping')
    return session
  }

  private authParams() {
    return new URLSearchParams({
      u: this.session.username,
      p: encodePassword(this.session.password),
      v: '1.16.1',
      c: 'lm-music',
      f: 'json',
    })
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const query = this.authParams()
    Object.entries(params).forEach(([key, value]) => query.set(key, value))
    const response = await fetch(`${this.session.serverUrl}/rest/${endpoint}.view?${query}`)
    if (!response.ok) throw new Error(t('error.providerRequestFailed', { provider: 'Navidrome', status: response.status }))
    const body = await response.json() as SubsonicResponse<T>
    const result = body['subsonic-response']
    if (result.status !== 'ok') throw new Error(result.error?.message ?? t('error.navidromeRejected'))
    return result
  }

  async getPlaylists(): Promise<Playlist[]> {
    const result = await this.request<{ playlists?: { playlist?: SubsonicPlaylist[] } }>('getPlaylists')
    return Promise.all((result.playlists?.playlist ?? []).map(async (playlist) => {
      const tracks = await this.getPlaylistTracks(playlist.id)
      return {
        id: playlist.id,
        name: playlist.name,
        coverUrl: playlist.coverArt ? this.coverUrl(playlist.coverArt) : tracks[0]?.coverUrl,
        tracks,
      }
    }))
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    const result = await this.request<{ playlist?: { entry?: SubsonicSong[] } }>('getPlaylist', { id: playlistId })
    return (result.playlist?.entry ?? []).map((song) => this.toTrack(song))
  }

  streamUrl(trackId: string) {
    return this.endpointUrl('stream', { id: trackId })
  }

  coverUrl(coverArtId: string) {
    return this.endpointUrl('getCoverArt', { id: coverArtId, size: '800' })
  }

  async getLyrics(trackId: string): Promise<LyricLine[]> {
    const result = await this.request<{ lyrics?: SubsonicLyrics }>('getLyrics', { id: trackId })
    const lyrics = result.lyrics
    if (lyrics?.syncedLyrics?.length) return lyrics.syncedLyrics.map((line) => ({ time: line.start / 1000, text: line.value }))
    return lyrics?.value ? parseLrc(lyrics.value) : []
  }

  private endpointUrl(endpoint: string, params: Record<string, string>) {
    const query = this.authParams()
    Object.entries(params).forEach(([key, value]) => query.set(key, value))
    return `${this.session.serverUrl}/rest/${endpoint}.view?${query}`
  }

  private toTrack(song: SubsonicSong): Track {
    return {
      id: song.id,
      title: song.title,
      artist: song.artist ?? t('artist.unknown'),
      album: song.album,
      duration: song.duration ?? 0,
      coverUrl: song.coverArt ? this.coverUrl(song.coverArt) : undefined,
      streamUrl: this.streamUrl(song.id),
      lyrics: [],
    }
  }
}
