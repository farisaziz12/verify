import { describe, expect, it } from 'vitest'
import { HOUR } from '@/lib/time'
import { decideAccess } from './gate'
import { issueSession } from './session'

const PASSWORD = 'horse-battery-staple'
const NOW = 1_700_000_000_000

describe('decideAccess', () => {
  it('allows every path when the password is unset or empty', () => {
    expect(
      decideAccess({ password: undefined, cookie: undefined, pathname: '/', search: '' }),
    ).toEqual({ kind: 'allow' })
    expect(
      decideAccess({ password: '', cookie: undefined, pathname: '/api/domains', search: '' }),
    ).toEqual({ kind: 'allow' })
  })

  it('allows /access and a valid cookie', () => {
    const cookie = issueSession(PASSWORD, NOW)
    expect(
      decideAccess({
        password: PASSWORD,
        cookie: undefined,
        pathname: '/access',
        search: '',
        nowMs: NOW,
      }),
    ).toEqual({ kind: 'allow' })
    expect(
      decideAccess({
        password: PASSWORD,
        cookie,
        pathname: '/domains/abc',
        search: '',
        nowMs: NOW,
      }),
    ).toEqual({ kind: 'allow' })
  })

  it('redirects pages and rejects API calls when the cookie is missing or expired', () => {
    const expired = issueSession(PASSWORD, NOW - 2 * HOUR)
    expect(
      decideAccess({
        password: PASSWORD,
        cookie: expired,
        pathname: '/',
        search: '',
        nowMs: NOW,
      }),
    ).toEqual({ kind: 'redirect', next: '/' })
    expect(
      decideAccess({
        password: PASSWORD,
        cookie: undefined,
        pathname: '/domains/abc',
        search: '?x=1',
        nowMs: NOW,
      }),
    ).toEqual({ kind: 'redirect', next: '/domains/abc?x=1' })
    expect(
      decideAccess({
        password: PASSWORD,
        cookie: 'forged',
        pathname: '/api/domains',
        search: '',
        nowMs: NOW,
      }),
    ).toEqual({ kind: 'unauthorized' })
  })
})
