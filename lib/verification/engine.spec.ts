import { describe, expect, it, vi } from 'vitest'
import type { Domain } from '@/lib/db/schema'
import type { QueryOutcome, Resolver } from '@/lib/dns/types'
import { runCheck } from './engine'
import { recordValue } from './token'

const NOW = new Date('2026-08-09T12:00:00Z')
const TOKEN = 'abcdefghijklmnopqrstuvwxyz'

const domain = (overrides: Partial<Domain> = {}): Domain => ({
  id: '019fe66f-bb9d-72c5-9706-f583cd4b4c81',
  name: 'example.com',
  token: TOKEN,
  status: 'pending',
  nextCheckAt: NOW,
  claimedAt: NOW,
  verifiedAt: null,
  lastCheckedAt: null,
  ...overrides,
})

const answered = (...values: string[]): QueryOutcome => ({
  kind: 'answered',
  records: values.map((value) => ({ value })),
  ttl: 300,
})
const nxdomain: QueryOutcome = { kind: 'nxdomain', negativeTtl: 60 }

/** Answers per queried name; anything unlisted comes back nxdomain. */
function resolverFor(byName: Record<string, QueryOutcome>): {
  resolver: Resolver
  query: ReturnType<typeof vi.fn>
} {
  const query = vi.fn(async (name: string) => ({
    resolver: 'cloudflare',
    outcome: byName[name] ?? nxdomain,
  }))
  return { resolver: { name: 'cloudflare', query } satisfies Resolver, query }
}

const deps = (byName: Record<string, QueryOutcome>) => ({
  ...resolverFor(byName),
  now: () => NOW,
})

describe('runCheck', () => {
  it('verifies when the record is at the right name', async () => {
    const { resolver, query } = resolverFor({ '_claim.example.com': answered(recordValue(TOKEN)) })

    const { check, transition } = await runCheck(domain(), 'manual', { resolver, now: () => NOW })

    expect(check.diagnosisCode).toBe('VERIFIED_OK')
    expect(check.verdict).toBe('pass')
    expect(transition.to).toBe('verified')
    expect(query).toHaveBeenCalledOnce()
  })

  it('does not probe the doubled name once the primary matched', async () => {
    const { resolver, query } = resolverFor({ '_claim.example.com': answered(recordValue(TOKEN)) })
    await runCheck(domain(), 'manual', { resolver, now: () => NOW })
    expect(query.mock.calls.map((c) => c[0])).toEqual(['_claim.example.com'])
  })

  it('probes the doubled name when the primary did not match', async () => {
    const { resolver, query } = resolverFor({})
    await runCheck(domain(), 'manual', { resolver, now: () => NOW })
    expect(query.mock.calls.map((c) => c[0])).toEqual([
      '_claim.example.com',
      '_claim.example.com.example.com',
    ])
  })

  it('catches a provider that appended the zone', async () => {
    const { resolver } = resolverFor({
      '_claim.example.com.example.com': answered(recordValue(TOKEN)),
    })

    const { check, transition } = await runCheck(domain(), 'manual', { resolver, now: () => NOW })

    expect(check.diagnosisCode).toBe('ZONE_NAME_APPENDED')
    expect(transition.to).toBe('pending')
  })

  it('records every lookup in the trail, with the adapter that answered', async () => {
    const { resolver } = resolverFor({})
    const { check } = await runCheck(domain(), 'manual', { resolver, now: () => NOW })

    expect(check.lookups).toHaveLength(2)
    expect(check.lookups[0]).toMatchObject({
      name: '_claim.example.com',
      purpose: 'the record you published',
      resolver: 'cloudflare',
    })
    expect(check.lookups[1]?.purpose).toMatch(/appended/)
    expect(check.lookups.every((l) => typeof l.latencyMs === 'number')).toBe(true)
  })

  it('records the trigger without branching on it', async () => {
    const byName = { '_claim.example.com': answered(recordValue(TOKEN)) }
    const manual = await runCheck(domain(), 'manual', deps(byName))
    const sweep = await runCheck(domain(), 'sweep', deps(byName))

    expect(manual.check.trigger).toBe('manual')
    expect(sweep.check.trigger).toBe('sweep')
    expect(manual.check.diagnosisCode).toBe(sweep.check.diagnosisCode)
    expect(manual.transition).toEqual(sweep.transition)
  })

  it('leaves the status alone when DNS could not be reached', async () => {
    const { resolver } = resolverFor({ '_claim.example.com': { kind: 'error', reason: 'timeout' } })

    const { check, transition } = await runCheck(domain(), 'manual', { resolver, now: () => NOW })

    expect(check.diagnosisCode).toBe('DNS_UNREACHABLE')
    expect(check.verdict).toBe('indeterminate')
    expect(transition.from).toBe('pending')
    expect(transition.to).toBe('pending')
  })

  it('does not demote a verified domain when the record disappears', async () => {
    const { resolver } = resolverFor({})
    const { transition } = await runCheck(domain({ status: 'verified' }), 'sweep', {
      resolver,
      now: () => NOW,
    })
    expect(transition.to).toBe('verified')
  })

  it('carries the evidence a mismatch needs to be explained', async () => {
    const { resolver } = resolverFor({ '_claim.example.com': answered('verify=stale') })
    const { check } = await runCheck(domain(), 'manual', { resolver, now: () => NOW })

    expect(check.diagnosisCode).toBe('TOKEN_MISMATCH')
    expect(check.evidence).toEqual({ expected: recordValue(TOKEN), found: ['verify=stale'] })
  })

  it('produces a complete check row, with no nulls where a value is required', async () => {
    const { resolver } = resolverFor({ '_claim.example.com': answered(recordValue(TOKEN)) })
    const { check } = await runCheck(domain(), 'manual', { resolver, now: () => NOW })

    expect(check.domainId).toBe(domain().id)
    expect(check.startedAt).toEqual(NOW)
    expect(check.finishedAt.getTime()).toBeGreaterThanOrEqual(NOW.getTime())
    expect(check.verdict).toBeTruthy()
    expect(check.diagnosisCode).toBeTruthy()
  })
})
