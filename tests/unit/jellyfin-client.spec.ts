import { afterEach, describe, expect, it, vi } from 'vitest'
import { JellyfinClient } from '@/services/jellyfin/client'
import type { JellyfinSession } from '@/types/music'

const session: JellyfinSession = {
  provider: 'jellyfin',
  serverUrl: 'https://jellyfin.example',
  accessToken: 'token',
  userId: 'user-1',
  username: 'alice',
}

const item = (index: number) => ({
  Id: `item-${index}`,
  Name: `Song ${index}`,
  RunTimeTicks: 100_000_000,
})

const jsonPage = (items: unknown[]) => new Response(JSON.stringify({ Items: items }), { status: 200 })

describe('JellyfinClient.getAllTracks', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns a single page when the library is smaller than one page', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonPage([item(0), item(1)]))
    vi.stubGlobal('fetch', fetchMock)

    const tracks = await new JellyfinClient(session).getAllTracks()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(new URL(fetchMock.mock.calls[0]![0] as string).searchParams.get('StartIndex')).toBe('0')
    expect(tracks.map((track) => track.id)).toEqual(['item-0', 'item-1'])
  })

  it('pages through the whole library until a short page is returned', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonPage(Array.from({ length: 500 }, (_, index) => item(index))))
      .mockResolvedValueOnce(jsonPage(Array.from({ length: 3 }, (_, index) => item(500 + index))))
    vi.stubGlobal('fetch', fetchMock)

    const tracks = await new JellyfinClient(session).getAllTracks()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(new URL(fetchMock.mock.calls[0]![0] as string).searchParams.get('StartIndex')).toBe('0')
    expect(new URL(fetchMock.mock.calls[1]![0] as string).searchParams.get('StartIndex')).toBe('500')
    expect(tracks).toHaveLength(503)
    expect(tracks[0]!.id).toBe('item-0')
    expect(tracks[502]!.id).toBe('item-502')
  })
})
