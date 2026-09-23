import { describe, expect, it } from 'vitest'
import { HOUR, SECOND } from '@/lib/time'
import {
  ACCESS_MAX_AGE_SECONDS,
  accessCookieOptions,
  issueSession,
  passwordsMatch,
  safeNextPath,
  sessionIsValid,
} from './session'

const PASSWORD = 'horse-battery-staple'
const NOW = 1_700_000_000_000

describe('issueSession', () => {
  it('expires one hour after issue and does not contain the password', () => {
    const token = issueSession(PASSWORD, NOW)
    const exp = Math.floor(NOW / SECOND) + 60 * 60
    expect(token.startsWith(`${exp}.`)).toBe(true)
    expect(token).not.toContain(PASSWORD)
    expect(ACCESS_MAX_AGE_SECONDS).toBe(60 * 60)
  })
})

describe('sessionIsValid', () => {
  it('accepts a token at issue and until the hour is up', () => {
    const token = issueSession(PASSWORD, NOW)
    expect(sessionIsValid(token, PASSWORD, NOW)).toBe(true)
    expect(sessionIsValid(token, PASSWORD, NOW + HOUR - SECOND)).toBe(true)
  })

  it('rejects a token once the hour has elapsed', () => {
    const token = issueSession(PASSWORD, NOW)
    expect(sessionIsValid(token, PASSWORD, NOW + HOUR)).toBe(false)
  })

  it('allows sixty seconds of clock skew and rejects sixty-one', () => {
    const token = issueSession(PASSWORD, NOW)
    expect(sessionIsValid(token, PASSWORD, NOW - 60 * SECOND)).toBe(true)
    expect(sessionIsValid(token, PASSWORD, NOW - 61 * SECOND)).toBe(false)
  })

  it('rejects a different password, a tampered expiry, and a short signature', () => {
    const token = issueSession(PASSWORD, NOW)
    const payload = token.slice(0, token.indexOf('.'))
    expect(sessionIsValid(token, 'other-password', NOW)).toBe(false)
    expect(sessionIsValid(`${Number(payload) + 1}.${token.split('.')[1]}`, PASSWORD, NOW)).toBe(
      false,
    )
    expect(sessionIsValid(`${payload}.ab`, PASSWORD, NOW)).toBe(false)
    expect(sessionIsValid('not-a-token', PASSWORD, NOW)).toBe(false)
  })
})

describe('passwordsMatch', () => {
  it('matches equal strings and rejects different lengths without throwing', () => {
    expect(passwordsMatch(PASSWORD, PASSWORD)).toBe(true)
    expect(passwordsMatch(PASSWORD, `${PASSWORD}x`)).toBe(false)
    expect(passwordsMatch('short', PASSWORD)).toBe(false)
  })
})

describe('accessCookieOptions', () => {
  it('is an HttpOnly hour-long cookie, secure only when asked', () => {
    expect(accessCookieOptions(true)).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: true,
      maxAge: 60 * 60,
    })
    expect(accessCookieOptions(false).secure).toBe(false)
  })
})

describe('safeNextPath', () => {
  it('keeps a same-origin path and its query', () => {
    expect(safeNextPath('/domains/abc?x=1')).toBe('/domains/abc?x=1')
  })

  it('replaces missing, absolute, and protocol-relative targets with /', () => {
    expect(safeNextPath(undefined)).toBe('/')
    expect(safeNextPath(null)).toBe('/')
    expect(safeNextPath('')).toBe('/')
    expect(safeNextPath('https://evil.example')).toBe('/')
    expect(safeNextPath('//evil.example')).toBe('/')
    expect(safeNextPath('/\\evil.example')).toBe('/')
    expect(safeNextPath('/%2F%2Fevil.example')).toBe('/')
    expect(safeNextPath('/%')).toBe('/')
    expect(safeNextPath('/ok%2Fpath')).toBe('/ok%2Fpath')
  })
})
