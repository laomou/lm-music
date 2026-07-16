import type { JellyfinSession, LyricLine, Playlist, Track } from '@/types/music'
import { t } from '@/i18n'

type JellyfinItem = {
  Id: string
  Name: string
  RunTimeTicks?: number
  Album?: string
  AlbumId?: string
  AlbumPrimaryImageTag?: string
  AlbumArtist?: string
  Artists?: string[]
  ImageTags?: { Primary?: string }
}

type JellyfinItemsResponse = { Items: JellyfinItem[] }

type AuthResponse = { AccessToken: string; User: { Id: string; Name: string } }

export class JellyfinClient {
  constructor(private readonly session: JellyfinSession) {}

  static async login(serverUrl: string, username: string, password: string): Promise<JellyfinSession> {
    const url = serverUrl.replace(/\/$/, '')
    const response = await fetch(`${url}/Users/AuthenticateByName`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'MediaBrowser Client="LM Music", Device="Web", DeviceId="lm-music-pwa", Version="0.1.0"',
      },
      body: JSON.stringify({ Username: username, Pw: password }),
    })
    if (!response.ok) throw new Error(t('error.jellyfinLoginFailed'))
    const data = await response.json() as AuthResponse
    return { provider: 'jellyfin', serverUrl: url, accessToken: data.AccessToken, userId: data.User.Id, username: data.User.Name }
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.session.serverUrl}${path}`, {
      headers: { 'X-Emby-Token': this.session.accessToken },
    })
    if (!response.ok) throw new Error(t('error.providerRequestFailed', { provider: 'Jellyfin', status: response.status }))
    return response.json() as Promise<T>
  }

  async getPlaylists(): Promise<Playlist[]> {
    const params = new URLSearchParams({
      UserId: this.session.userId,
      IncludeItemTypes: 'Playlist',
      Recursive: 'true',
      Fields: 'PrimaryImageAspectRatio,ChildCount',
    })
    const result = await this.request<JellyfinItemsResponse>(`/Users/${this.session.userId}/Items?${params}`)
    return Promise.all(result.Items.map(async (item) => {
      const tracks = await this.getPlaylistTracks(item.Id)
      return {
        id: item.Id,
        name: item.Name,
        // Playlist artwork can be absent or stale in Jellyfin. Reusing the
        // first track's album art avoids noisy 404 image requests.
        coverUrl: tracks[0]?.coverUrl,
        tracks,
      }
    }))
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    const params = new URLSearchParams({ UserId: this.session.userId, Fields: 'PrimaryImageAspectRatio,AlbumPrimaryImageTag' })
    const result = await this.request<JellyfinItemsResponse>(`/Playlists/${playlistId}/Items?${params}`)
    return result.Items.map((item) => this.toTrack(item))
  }

  imageUrl(itemId: string, tag?: string) {
    if (!tag) return undefined
    const query = new URLSearchParams({ maxWidth: '800', quality: '90', api_key: this.session.accessToken })
    query.set('tag', tag)
    return `${this.session.serverUrl}/Items/${itemId}/Images/Primary?${query}`
  }

  streamUrl(trackId: string) {
    const query = new URLSearchParams({
      static: 'true',
      api_key: this.session.accessToken,
      deviceId: 'lm-music-pwa',
    })
    return `${this.session.serverUrl}/Audio/${trackId}/universal?${query}`
  }

  transcodedStreamUrl(trackId: string) {
    const query = new URLSearchParams({
      api_key: this.session.accessToken,
      userId: this.session.userId,
      deviceId: 'lm-music-pwa',
      static: 'false',
      audioCodec: 'mp3',
      transcodingContainer: 'mp3',
      transcodingProtocol: 'http',
    })
    return `${this.session.serverUrl}/Audio/${trackId}/stream.mp3?${query}`
  }

  async getLyrics(trackId: string): Promise<LyricLine[]> {
    const response = await fetch(`${this.session.serverUrl}/Audio/${trackId}/Lyrics`, {
      headers: { 'X-Emby-Token': this.session.accessToken },
    })
    if (!response.ok) return []
    const data = await response.json() as { Lyrics?: Array<{ Start?: number; Text?: string }> }
    return (data.Lyrics ?? []).map((line) => ({ time: (line.Start ?? 0) / 10_000_000, text: line.Text ?? '' }))
  }

  private toTrack(item: JellyfinItem): Track {
    return {
      id: item.Id,
      title: item.Name,
      artist: item.AlbumArtist ?? item.Artists?.join(', ') ?? t('artist.unknown'),
      album: item.Album,
      duration: Math.round((item.RunTimeTicks ?? 0) / 10_000_000),
      coverUrl: (item.AlbumId ? this.imageUrl(item.AlbumId, item.AlbumPrimaryImageTag) : undefined) ?? this.imageUrl(item.Id, item.ImageTags?.Primary),
      streamUrl: this.streamUrl(item.Id),
      fallbackStreamUrl: this.transcodedStreamUrl(item.Id),
      lyrics: [],
    }
  }
}
