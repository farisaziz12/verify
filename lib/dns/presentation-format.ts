/** One `"…"` chunk; an escaped quote does not end it. */
const QUOTED_CHUNK = /"((?:[^"\\]|\\.)*)"/gs

/** A backslash followed by either three decimal digits (`\233`) or one character (`\"`). */
const ESCAPE = /\\(\d{3}|.)/gs

/** Decodes Cloudflare's TXT `data` field (RFC 1035); chunks join with nothing between them. */
export function decodeCloudflareTxt(data: string): string {
  return [...data.matchAll(QUOTED_CHUNK)].map((match) => applyEscapes(match[1] ?? '')).join('')
}

/** Identity: Google returns TXT values already decoded and unquoted. */
export function decodeGoogleTxt(data: string): string {
  return data
}

/** Applies the RFC 1035 §5.1 escapes: `\\`, `\"`, and `\DDD` for a byte in decimal. */
function applyEscapes(chunk: string): string {
  return chunk.replace(ESCAPE, (_, escaped: string) =>
    /^\d{3}$/.test(escaped) ? String.fromCharCode(Number(escaped)) : escaped,
  )
}
