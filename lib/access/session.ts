import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { HOUR, SECOND } from '@/lib/time'

export const ACCESS_COOKIE = 'verify_access'

/** Cookie `Max-Age` and the token's expiry, in seconds. */
export const ACCESS_MAX_AGE_SECONDS = HOUR / SECOND

/** How far past the hour an expiry may sit before it is rejected. */
const EXPIRY_SKEW_SECONDS = 60

export function accessCookieOptions(secure: boolean): {
  httpOnly: true
  sameSite: 'lax'
  path: '/'
  secure: boolean
  maxAge: number
} {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
    maxAge: ACCESS_MAX_AGE_SECONDS,
  }
}

/** `expiryUnix.hmac`. Expiry is `ACCESS_MAX_AGE_SECONDS` after `nowMs`. */
export function issueSession(password: string, nowMs: number = Date.now()): string {
  const exp = Math.floor(nowMs / SECOND) + ACCESS_MAX_AGE_SECONDS
  const payload = String(exp)
  return `${payload}.${sign(password, payload)}`
}

/** True when the HMAC matches and expiry is still inside the hour, plus skew. */
export function sessionIsValid(
  token: string,
  password: string,
  nowMs: number = Date.now(),
): boolean {
  const dot = token.indexOf('.')
  if (dot <= 0 || dot !== token.lastIndexOf('.')) return false

  const payload = token.slice(0, dot)
  const signature = token.slice(dot + 1)
  if (!/^\d+$/.test(payload)) return false

  const exp = Number(payload)
  if (!Number.isSafeInteger(exp)) return false

  const nowSec = Math.floor(nowMs / SECOND)
  if (exp <= nowSec) return false
  if (exp > nowSec + ACCESS_MAX_AGE_SECONDS + EXPIRY_SKEW_SECONDS) return false

  return signaturesMatch(signature, sign(password, payload))
}

/** SHA-256 both sides, then a constant-time compare. Lengths may differ. */
export function passwordsMatch(input: string, expected: string): boolean {
  const inputDigest = createHash('sha256').update(input).digest()
  const expectedDigest = createHash('sha256').update(expected).digest()
  return timingSafeEqual(inputDigest, expectedDigest)
}

/** A same-origin path. Anything else, including a decoded open redirect, becomes `/`. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !isSameOriginPath(value)) return '/'
  try {
    if (!isSameOriginPath(decodeURIComponent(value))) return '/'
  } catch {
    return '/'
  }
  return value
}

function isSameOriginPath(value: string): boolean {
  if (!value.startsWith('/') || value.startsWith('//')) return false
  if (value.includes('\\') || value.includes('://')) return false
  return !hasControlCharacter(value)
}

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0)
    if (code <= 31 || code === 127) return true
  }
  return false
}

function sign(password: string, payload: string): string {
  return createHmac('sha256', password).update(payload).digest('base64url')
}

function signaturesMatch(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual)
  const expectedBytes = Buffer.from(expected)
  if (actualBytes.length !== expectedBytes.length) return false
  return timingSafeEqual(actualBytes, expectedBytes)
}
