import { parse } from 'tldts'
import { ASCII_HOSTNAME, MALFORMED_STRUCTURE, WWW_PREFIX } from './patterns'

export type NormalizeResult = { ok: true; name: string } | { ok: false; error: string }

/** Shared by every structural rejection, so the three of them cannot drift apart. */
const MALFORMED = "Check the dots and hyphens — that isn't a valid domain"

/**
 * Coerces user input into the canonical name we store and query DNS for.
 *
 * The order of the steps is the contract, because several of them would give a wrong
 * answer if reordered:
 *
 *   1. empty input
 *   2. extract the hostname — drops scheme, path, query, port, and the root dot
 *   3. strip `www.` — *before* registrability, since `www.co.uk` is itself registrable
 *   4. reject IP addresses
 *   5. reject a bare public suffix — *before* the missing-dot check, so `com` is reported
 *      as a suffix rather than told to try `com.com`
 *   6. reject a single label with no dot
 *   7. punycode, then reject malformed structure, then illegal characters
 */
export function normalizeDomain(raw: string): NormalizeResult {
  if (!raw.trim()) return { ok: false, error: 'Enter a domain' }

  const hostname = parse(raw, { allowPrivateDomains: true }).hostname
  if (!hostname) return { ok: false, error: MALFORMED }

  const host = hostname.replace(WWW_PREFIX, '')

  const parsed = parse(host, { allowPrivateDomains: true })
  if (parsed.isIp) return { ok: false, error: "That's an IP address — enter a domain name" }

  if (parsed.domain === null) {
    if (parsed.publicSuffix === host && (parsed.isIcann || parsed.isPrivate)) {
      return {
        ok: false,
        error: `That's a public suffix — you can't claim ${host}, only a domain under it`,
      }
    }
    if (!host.includes('.')) {
      return { ok: false, error: `That's missing a top-level domain — try ${host}.com` }
    }
    return { ok: false, error: MALFORMED }
  }

  const ascii = punycode(host)
  if (!ascii || MALFORMED_STRUCTURE.test(ascii)) return { ok: false, error: MALFORMED }
  if (!ASCII_HOSTNAME.test(ascii)) {
    return { ok: false, error: 'Domains can only contain letters, numbers, hyphens and dots' }
  }

  return { ok: true, name: ascii }
}

function punycode(host: string): string | null {
  try {
    return new URL(`http://${host}`).hostname
  } catch {
    return null
  }
}
