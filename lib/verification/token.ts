import { randomBytes } from 'node:crypto'

/** The RFC 4648 base32 alphabet, lowercased. Excludes 0, 1, 8 and 9 by design. */
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567'

const TOKEN_BYTES = 16

/** 128 bits of entropy as 26 base32 characters. */
export function mintToken(): string {
  return encodeBase32(randomBytes(TOKEN_BYTES))
}

/** The name the user creates in their zone. */
export function recordName(domain: string): string {
  return `_claim.${domain}`
}

/** The value that record must hold. */
export function recordValue(token: string): string {
  return `verify=${token}`
}

/**
 * Packs bytes into base32, 5 bits per character.
 *
 * Emits `ceil(bytes * 8 / 5)` characters — 26 for our 16 bytes. Since 128 is not a multiple
 * of 5, the final character carries only 3 real bits and is right-padded with zeroes; there
 * is no `=` padding.
 */
function encodeBase32(bytes: Uint8Array): string {
  let out = ''
  let buffer = 0
  let bits = 0

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      out += ALPHABET[(buffer >>> bits) & 31]
    }
  }
  if (bits > 0) out += ALPHABET[(buffer << (5 - bits)) & 31]

  return out
}
