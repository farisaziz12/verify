/**
 * One `"…"` chunk. The body matches either an ordinary character or a backslash escape, so
 * an escaped quote never ends the chunk — which is also why the whole value cannot simply be
 * split on `" "`: a chunk ending in `\"` contains that separator inside its own data.
 */
const QUOTED_CHUNK = /"((?:[^"\\]|\\.)*)"/gs

/** A backslash followed by either three decimal digits (`\233`) or one character (`\"`). */
const ESCAPE = /\\(\d{3}|.)/gs

/**
 * Decodes Cloudflare's TXT `data` field, which is RFC 1035 presentation format.
 *
 * A TXT record is a sequence of character-strings, each capped at 255 bytes, so a long value
 * arrives as several quoted chunks separated by a space: `"first" "second"`. The chunks are
 * concatenated with nothing between them — the space belongs to the encoding, not the value.
 */
export function decodeCloudflareTxt(data: string): string {
  return [...data.matchAll(QUOTED_CHUNK)].map((match) => applyEscapes(match[1] ?? '')).join('')
}

/**
 * Google returns TXT values already decoded and unquoted, so this is identity.
 *
 * Named rather than skipped so that decoding is visibly a per-adapter concern. Google's own
 * documentation claims values are quoted; every live response says otherwise, and
 * `presentation-format.spec.ts` pins the behaviour we actually observed.
 */
export function decodeGoogleTxt(data: string): string {
  return data
}

/** Applies the RFC 1035 §5.1 escapes: `\\`, `\"`, and `\DDD` for a byte in decimal. */
function applyEscapes(chunk: string): string {
  return chunk.replace(ESCAPE, (_, escaped: string) =>
    /^\d{3}$/.test(escaped) ? String.fromCharCode(Number(escaped)) : escaped,
  )
}
