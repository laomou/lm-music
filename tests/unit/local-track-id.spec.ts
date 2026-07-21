import { describe, expect, it } from 'vitest'
import { decodeLocalTrackId, encodeLocalTrackId } from '@/services/local/client'

describe('local track ids', () => {
  it('preserves colons, slashes, and Unicode path segments', () => {
    const reference = {
      path: ['音乐:收藏', 'AC/DC', '01: 开场.mp3'],
      lastModified: 1_725_000_000_000,
      size: 4_096,
    }

    const id = encodeLocalTrackId(reference)

    expect(id).toMatch(/^local:/)
    expect(decodeLocalTrackId(id)).toEqual(reference)
  })

  it('continues to read previously persisted colon-delimited ids', () => {
    expect(decodeLocalTrackId('local:Artist: Live/01: Intro.mp3:123:456')).toEqual({
      path: ['Artist: Live', '01: Intro.mp3'],
      lastModified: 123,
      size: 456,
    })
  })

  it('rejects malformed local ids', () => {
    expect(decodeLocalTrackId('remote:track')).toBeNull()
    expect(decodeLocalTrackId('local:not-valid')).toBeNull()
    expect(decodeLocalTrackId('local::123:456')).toBeNull()
  })
})
