import { describe, expect, it } from 'vitest'
import { mintToken, recordName, recordValue } from './token'

describe('mintToken', () => {
  it('is 26 lowercase base32 characters', () => {
    for (let i = 0; i < 100; i++) {
      expect(mintToken()).toMatch(/^[a-z2-7]{26}$/)
    }
  })

  it('does not repeat', () => {
    const tokens = new Set(Array.from({ length: 1000 }, mintToken))
    expect(tokens.size).toBe(1000)
  })

  it('spreads across the alphabet rather than favouring a prefix', () => {
    const leading = new Set(Array.from({ length: 500 }, () => mintToken()[0]))
    expect(leading.size).toBeGreaterThan(20)
  })
})

describe('record helpers', () => {
  it('builds the name and value the user publishes', () => {
    expect(recordName('example.com')).toBe('_claim.example.com')
    expect(recordValue('abcdefghijklmnopqrstuvwxyz')).toBe('verify=abcdefghijklmnopqrstuvwxyz')
  })
})
