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

const MD5_SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

const MD5_CONSTANTS = Array.from({ length: 64 }, (_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 2 ** 32) >>> 0)

function rotateLeft(value: number, shift: number) {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0
}

// Subsonic token authentication requires MD5(password + salt). The browser
// Web Crypto API deliberately does not expose MD5, so keep the algorithm
// contained here instead of ever putting the password in a request URL.
function md5(value: string) {
  const input = new TextEncoder().encode(value)
  const paddedLength = (((input.length + 8) >>> 6) + 1) << 6
  const bytes = new Uint8Array(paddedLength)
  bytes.set(input)
  bytes[input.length] = 0x80
  const view = new DataView(bytes.buffer)
  const bitLength = input.length * 8
  view.setUint32(paddedLength - 8, bitLength >>> 0, true)
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 2 ** 32), true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476
  for (let offset = 0; offset < paddedLength; offset += 64) {
    const words = Array.from({ length: 16 }, (_, index) => view.getUint32(offset + index * 4, true))
    let a = a0
    let b = b0
    let c = c0
    let d = d0
    for (let index = 0; index < 64; index += 1) {
      let f = 0
      let g = 0
      if (index < 16) {
        f = (b & c) | (~b & d)
        g = index
      } else if (index < 32) {
        f = (d & b) | (~d & c)
        g = (5 * index + 1) % 16
      } else if (index < 48) {
        f = b ^ c ^ d
        g = (3 * index + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * index) % 16
      }
      const next = (b + rotateLeft((a + f + MD5_CONSTANTS[index]! + words[g]!) >>> 0, MD5_SHIFTS[index]!)) >>> 0
      a = d
      d = c
      c = b
      b = next
    }
    a0 = (a0 + a) >>> 0
    b0 = (b0 + b) >>> 0
    c0 = (c0 + c) >>> 0
    d0 = (d0 + d) >>> 0
  }
  return [a0, b0, c0, d0].flatMap((word) => Array.from({ length: 4 }, (_, index) => ((word >>> (index * 8)) & 0xff).toString(16).padStart(2, '0'))).join('')
}

function createSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export class NavidromeClient {
  constructor(private readonly session: SubsonicSession) {}

  static async login(serverUrl: string, username: string, password: string): Promise<SubsonicSession> {
    const salt = createSalt()
    const session: SubsonicSession = {
      provider: 'subsonic',
      serverUrl: serverUrl.replace(/\/$/, ''),
      username,
      salt,
      token: md5(`${password}${salt}`),
    }
    const client = new NavidromeClient(session)
    await client.request('ping')
    return session
  }

  private authParams() {
    return new URLSearchParams({
      u: this.session.username,
      t: this.session.token,
      s: this.session.salt,
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
    const playlists = await Promise.all((result.playlists?.playlist ?? []).map(async (playlist) => {
      const tracks = await this.getPlaylistTracks(playlist.id)
      return {
        id: playlist.id,
        name: playlist.name,
        coverUrl: playlist.coverArt ? this.coverUrl(playlist.coverArt) : tracks[0]?.coverUrl,
        tracks,
      }
    }))
    const playablePlaylists = playlists.filter((playlist) => playlist.tracks.length > 0)
    if (playablePlaylists.length) return playablePlaylists

    const tracks = await this.getAllTracks()
    return tracks.length ? [{
      id: 'navidrome-all-songs',
      name: t('navidrome.allSongs'),
      description: t('navidrome.allSongsDescription'),
      coverUrl: tracks[0]?.coverUrl,
      tracks,
    }] : playlists
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

  async getAllTracks(): Promise<Track[]> {
    const result = await this.request<{ searchResult3?: { song?: SubsonicSong[] } }>('search3', { query: '', songCount: '500', artistCount: '0', albumCount: '0' })
    return (result.searchResult3?.song ?? []).map((song) => this.toTrack(song))
  }

  async search(query: string): Promise<Track[]> {
    const result = await this.request<{ searchResult3?: { song?: SubsonicSong[] } }>('search3', { query, songCount: '30', artistCount: '0', albumCount: '0' })
    return (result.searchResult3?.song ?? []).map((song) => this.toTrack(song))
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
