import type { JellyfinSession, LyricLine, Playlist, Track } from '@/types/music'

type JellyfinItem = {
  Id: string
  Name: string
  RunTimeTicks?: number
  Album?: string
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
    if (!response.ok) throw new Error('无法登录 Jellyfin，请检查服务器地址、用户名和密码。')
    const data = await response.json() as AuthResponse
    return { serverUrl: url, accessToken: data.AccessToken, userId: data.User.Id, username: data.User.Name }
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.session.serverUrl}${path}`, {
      headers: { 'X-Emby-Token': this.session.accessToken },
    })
    if (!response.ok) throw new Error(`Jellyfin 请求失败（${response.status}）`)
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
    return Promise.all(result.Items.map(async (item) => ({
      id: item.Id,
      name: item.Name,
      coverUrl: this.imageUrl(item.Id, item.ImageTags?.Primary),
      tracks: await this.getPlaylistTracks(item.Id),
    })))
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    const params = new URLSearchParams({ UserId: this.session.userId, Fields: 'PrimaryImageAspectRatio,AlbumPrimaryImageTag' })
    const result = await this.request<JellyfinItemsResponse>(`/Playlists/${playlistId}/Items?${params}`)
    return result.Items.map((item) => this.toTrack(item))
  }

  imageUrl(itemId: string, tag?: string) {
    const query = new URLSearchParams({ maxWidth: '800', quality: '90', api_key: this.session.accessToken })
    if (tag) query.set('tag', tag)
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
      artist: item.AlbumArtist ?? item.Artists?.join(', ') ?? '未知艺术家',
      album: item.Album,
      duration: Math.round((item.RunTimeTicks ?? 0) / 10_000_000),
      coverUrl: this.imageUrl(item.Id, item.ImageTags?.Primary),
      streamUrl: this.streamUrl(item.Id),
      lyrics: [],
    }
  }
}
