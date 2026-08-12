import { randomBytes } from 'node:crypto'

/** The RFC 4648 base32 alphabet, lowercased. */
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567'

const TOKEN_BYTES = 16

/** 128 bits of entropy as 26 base32 characters. */
export function mintToken(): string {
  return encodeBase32(randomBytes(TOKEN_BYTES))
}

export function recordName(domain: string): string {
  return `_claim.${domain}`
}

export function recordValue(token: string): string {
  return `verify=${token}`
}

/** Packs bytes into base32, 5 bits per character; unpadded. */
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
