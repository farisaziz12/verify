import { describe, expect, it } from 'vitest'
import cloudflareAnswered from './__fixtures__/cloudflare-answered.json'
import cloudflareMultiChunk from './__fixtures__/cloudflare-multi-chunk.json'
import googleAnswered from './__fixtures__/google-answered.json'
import googleMultiChunk from './__fixtures__/google-multi-chunk.json'
import { decodeCloudflareTxt, decodeGoogleTxt } from './presentation-format'

function txtData(fixture: { Answer?: { type: number; data: string }[] }): string[] {
  return (fixture.Answer ?? []).filter((a) => a.type === 16).map((a) => a.data)
}

describe('decodeCloudflareTxt', () => {
  it('strips the wrapping quotes', () => {
    expect(decodeCloudflareTxt('"MS=ms44452932"')).toBe('MS=ms44452932')
  })

  it('joins chunks with nothing — the separating space is encoding, not data', () => {
    expect(decodeCloudflareTxt('"abc" "def"')).toBe('abcdef')
  })

  it('unescapes quotes and backslashes (RFC 1035 §5.1)', () => {
    expect(decodeCloudflareTxt('"a\\"b"')).toBe('a"b')
    expect(decodeCloudflareTxt('"a\\\\b"')).toBe('a\\b')
  })

  it('decodes \\DDD byte escapes', () => {
    expect(decodeCloudflareTxt('"caf\\233"')).toBe('café')
  })

  // A chunk ending in an escaped quote contains the same `" "` that separates chunks, so a
  // naive split on that sequence would cut in the wrong place.
  it('is not fooled by a chunk ending in an escaped quote', () => {
    expect(decodeCloudflareTxt('"ab\\"" "cd"')).toBe('ab"cd')
  })

  it('handles an empty chunk', () => {
    expect(decodeCloudflareTxt('""')).toBe('')
  })
})

describe('decodeGoogleTxt', () => {
  it('returns the value unchanged', () => {
    expect(decodeGoogleTxt('MS=ms44452932')).toBe('MS=ms44452932')
  })
})

describe('against captured live responses', () => {
  it('Cloudflare wraps values in quotes and Google does not', () => {
    expect(txtData(cloudflareAnswered).every((d) => d.startsWith('"') && d.endsWith('"'))).toBe(
      true,
    )
    expect(txtData(googleAnswered).some((d) => d.startsWith('"'))).toBe(false)
  })

  /**
   * The strongest check available: two independent resolvers encode the same 415-byte DKIM
   * key differently, and decoding Cloudflare's form must reproduce Google's byte for byte.
   * A chunk-joining bug cannot survive this.
   */
  it('decodes a multi-chunk DKIM key to exactly what Google returns', () => {
    const [cloudflare] = txtData(cloudflareMultiChunk)
    const [google] = txtData(googleMultiChunk)
    if (!cloudflare || !google) throw new Error('fixtures must both hold a TXT record')

    expect(cloudflare).toContain('" "')
    expect(google).not.toContain('"')

    expect(decodeCloudflareTxt(cloudflare)).toBe(decodeGoogleTxt(google))
    expect(decodeCloudflareTxt(cloudflare)).toHaveLength(410)
  })

  it('decodes every answered value without leaving a stray quote', () => {
    for (const data of txtData(cloudflareAnswered)) {
      expect(decodeCloudflareTxt(data)).not.toContain('"')
    }
  })
})
