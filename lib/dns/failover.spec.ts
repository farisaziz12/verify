import { describe, expect, it, vi } from 'vitest'
import { withFailover } from './failover'
import type { QueryOutcome, Resolver } from './types'

function fake(name: string, outcome: QueryOutcome) {
  const query = vi.fn(async () => ({ resolver: name, outcome }))
  return { resolver: { name, query } satisfies Resolver, query }
}

const ANSWERED: QueryOutcome = { kind: 'answered', records: [{ value: 'v' }], ttl: 60 }
const NXDOMAIN: QueryOutcome = { kind: 'nxdomain', negativeTtl: 900 }
const NODATA: QueryOutcome = { kind: 'nodata', negativeTtl: 900 }
const TIMEOUT: QueryOutcome = { kind: 'error', reason: 'timeout' }

describe('withFailover', () => {
  it('does not call the backup when the primary answers', async () => {
    const primary = fake('cloudflare', ANSWERED)
    const backup = fake('google', ANSWERED)

    const result = await withFailover(primary.resolver, backup.resolver).query('x', 'TXT')

    expect(result.outcome).toEqual(ANSWERED)
    expect(result.resolver).toBe('cloudflare')
    expect(backup.query).not.toHaveBeenCalled()
  })

  it('falls through to the backup on an error, and reports who answered', async () => {
    const primary = fake('cloudflare', TIMEOUT)
    const backup = fake('google', ANSWERED)

    const result = await withFailover(primary.resolver, backup.resolver).query('x', 'TXT')

    expect(result.outcome).toEqual(ANSWERED)
    expect(result.resolver).toBe('google')
    expect(backup.query).toHaveBeenCalledOnce()
  })

  // The point of D2: a negative answer is an answer. Asking a second resolver whether it
  // agrees would be consensus, which doubles latency and adds a state the UI must explain.
  it.each([
    ['nxdomain', NXDOMAIN],
    ['nodata', NODATA],
  ])('treats %s as a real answer and never retries it', async (_label, outcome) => {
    const primary = fake('cloudflare', outcome)
    const backup = fake('google', ANSWERED)

    const result = await withFailover(primary.resolver, backup.resolver).query('x', 'TXT')

    expect(result.outcome).toEqual(outcome)
    expect(result.resolver).toBe('cloudflare')
    expect(backup.query).not.toHaveBeenCalled()
  })

  it('surfaces the backup’s error when both fail — never a silent success', async () => {
    const primary = fake('cloudflare', TIMEOUT)
    const backup = fake('google', { kind: 'error', reason: 'servfail' })

    const result = await withFailover(primary.resolver, backup.resolver).query('x', 'TXT')

    expect(result.outcome).toEqual({ kind: 'error', reason: 'servfail' })
    expect(result.resolver).toBe('google')
  })

  it('passes the name and record type through unchanged', async () => {
    const primary = fake('cloudflare', TIMEOUT)
    const backup = fake('google', ANSWERED)

    await withFailover(primary.resolver, backup.resolver).query('_claim.example.com', 'TXT')

    expect(primary.query).toHaveBeenCalledWith('_claim.example.com', 'TXT')
    expect(backup.query).toHaveBeenCalledWith('_claim.example.com', 'TXT')
  })
})
