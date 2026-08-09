import { describe, expect, it } from 'vitest'
import { normalizeDomain } from './normalize'

function name(raw: string): string {
  const result = normalizeDomain(raw)
  if (!result.ok) throw new Error(`expected ${raw} to normalize, got: ${result.error}`)
  return result.name
}

function error(raw: string): string {
  const result = normalizeDomain(raw)
  if (result.ok) throw new Error(`expected ${raw} to be rejected, got: ${result.name}`)
  return result.error
}

describe('normalizeDomain', () => {
  it('lowercases and trims', () => {
    expect(name('  EXAMPLE.COM  ')).toBe('example.com')
  })

  it('drops the root dot', () => {
    expect(name('example.com.')).toBe('example.com')
  })

  it('accepts a pasted address, discarding scheme, path, query and port', () => {
    expect(name('HTTPS://Example.COM/pricing?ref=1')).toBe('example.com')
    expect(name('example.com:3000')).toBe('example.com')
  })

  it('strips a leading www', () => {
    expect(name('www.example.com')).toBe('example.com')
  })

  it('keeps other subdomains — they are separately claimable', () => {
    expect(name('staging.acme.dev')).toBe('staging.acme.dev')
  })

  it('punycodes an internationalised name', () => {
    expect(name('bücher.de')).toBe('xn--bcher-kva.de')
    expect(name('münchen.example.com')).toBe('xn--mnchen-3ya.example.com')
  })

  it('leaves an already-punycoded name alone', () => {
    expect(name('xn--bcher-kva.de')).toBe('xn--bcher-kva.de')
  })

  it('rejects a bare public suffix but allows a domain under it', () => {
    expect(error('com')).toBe(
      "That's a public suffix — you can't claim com, only a domain under it",
    )
    expect(error('co.uk')).toBe(
      "That's a public suffix — you can't claim co.uk, only a domain under it",
    )
    expect(error('github.io')).toMatch(/public suffix/)
    expect(name('foo.github.io')).toBe('foo.github.io')
  })

  it('rejects www-prefixed public suffixes', () => {
    expect(error('www.co.uk')).toMatch(/public suffix/)
  })

  it('rejects a name with no dot, suggesting one', () => {
    expect(error('example')).toBe("That's missing a top-level domain — try example.com")
  })

  it('rejects an IP address by name', () => {
    expect(error('192.168.1.1')).toMatch(/IP address/)
  })

  it('rejects malformed names', () => {
    expect(error('-bad.com')).toMatch(/dots and hyphens/)
    expect(error('a..b.com')).toMatch(/dots and hyphens/)
    expect(error('example.com-')).toMatch(/dots and hyphens/)
    expect(error('exa mple.com')).toBeTruthy()
    expect(error('..')).toBeTruthy()
  })

  it('rejects characters that are not hostname characters', () => {
    expect(error('exa_mple.com')).toBe(
      'Domains can only contain letters, numbers, hyphens and dots',
    )
  })

  it('rejects empty input', () => {
    expect(error('')).toBe('Enter a domain')
    expect(error('   ')).toBe('Enter a domain')
  })
})
