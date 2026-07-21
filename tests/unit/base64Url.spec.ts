import { describe, expect, it } from 'vitest'
import { decodeBase64Url, encodeBase64Url } from '@/utils/base64Url'

describe('base64url utilities', () => {
  it('round-trips Unicode text without base64 padding or reserved URL characters', () => {
    const value = '音乐/Artist+曲目: 你好 👋'
    const encoded = encodeBase64Url(value)

    expect(encoded).not.toMatch(/[+/=]/)
    expect(decodeBase64Url(encoded)).toBe(value)
  })
})
