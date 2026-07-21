import { afterEach, describe, expect, it, vi } from 'vitest'
import { NavidromeClient } from '@/services/navidrome/client'

const fetchMock = vi.fn()

describe('NavidromeClient authentication', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('uses a token and salt instead of putting the password in request parameters', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(new Response(JSON.stringify({
      'subsonic-response': { status: 'ok' },
    }), { status: 200 })))
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((values) => {
      values.fill(0)
      return values
    })

    const session = await NavidromeClient.login('https://music.example/', 'alice', 'password')
    const requestUrl = new URL(fetchMock.mock.calls[0]![0] as string)

    expect(session).toEqual({
      provider: 'subsonic',
      serverUrl: 'https://music.example',
      username: 'alice',
      salt: '00000000000000000000000000000000',
      token: 'b41f01cd4c7cfd4a5070407c9131917e',
    })
    expect(requestUrl.searchParams.get('p')).toBeNull()
    expect(requestUrl.searchParams.get('t')).toBe(session.token)
    expect(requestUrl.searchParams.get('s')).toBe(session.salt)
  })
})
