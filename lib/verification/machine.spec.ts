import { describe, expect, it } from 'vitest'
import type { DomainStatus } from '@/lib/db/schema'
import { HOUR, MINUTE } from '@/lib/time'
import { FAR_FUTURE, transition } from './machine'

const NOW = new Date('2026-08-09T12:00:00Z')

function domain(status: DomainStatus, claimedMsAgo = 0) {
  return { status, claimedAt: new Date(NOW.getTime() - claimedMsAgo) }
}
const secondsFromNow = (d: Date) => (d.getTime() - NOW.getTime()) / 1000

describe('pending', () => {
  it('a passing check verifies it and stamps verifiedAt', () => {
    const result = transition(domain('pending'), 'pass', NOW)
    expect(result).toMatchObject({ from: 'pending', to: 'verified' })
    expect(result.changes.verifiedAt).toEqual(NOW)
    expect(secondsFromNow(result.changes.nextCheckAt)).toBe(24 * 3600)
  })

  it.each(['fail', 'indeterminate'] as const)('a %s check leaves it pending', (verdict) => {
    const result = transition(domain('pending'), verdict, NOW)
    expect(result.to).toBe('pending')
    expect(result.changes.verifiedAt).toBeUndefined()
  })
})

describe('verified', () => {
  it('stays verified on a pass and re-checks in a day', () => {
    const result = transition(domain('verified'), 'pass', NOW)
    expect(result.to).toBe('verified')
    expect(secondsFromNow(result.changes.nextCheckAt)).toBe(24 * 3600)
  })

  // Hysteresis is the stretch: the enum values exist, the demotion path does not.
  it.each(['fail', 'indeterminate'] as const)('does not demote on a %s check', (verdict) => {
    const result = transition(domain('verified'), verdict, NOW)
    expect(result.from).toBe('verified')
    expect(result.to).toBe('verified')
  })
})

describe('terminal states', () => {
  it.each(['expired', 'revoked'] as const)('%s never moves on a check', (status) => {
    for (const verdict of ['pass', 'fail', 'indeterminate'] as const) {
      const result = transition(domain(status), verdict, NOW)
      expect(result.to).toBe(status)
    }
  })

  it('parks nextCheckAt at FAR_FUTURE rather than leaving it null', () => {
    expect(transition(domain('expired'), 'fail', NOW).changes.nextCheckAt).toEqual(FAR_FUTURE)
  })
})

describe('the pending re-check cadence', () => {
  const cadences: [label: string, claimAge: number, expectedSeconds: number][] = [
    ['under 15 minutes', 5 * MINUTE, 30],
    ['between 15 minutes and 2 hours', 30 * MINUTE, 5 * 60],
    ['beyond 2 hours', 6 * HOUR, 3600],
  ]

  it.each(cadences)('checks %s later at %s seconds', (_label, claimAge, expectedSeconds) => {
    const result = transition(domain('pending', claimAge), 'fail', NOW)
    expect(secondsFromNow(result.changes.nextCheckAt)).toBe(expectedSeconds)
  })

  it('backs off as the claim ages rather than polling forever at one rate', () => {
    const intervals = [1 * MINUTE, 30 * MINUTE, 6 * HOUR].map((age) =>
      secondsFromNow(transition(domain('pending', age), 'fail', NOW).changes.nextCheckAt),
    )
    expect(intervals).toEqual([...intervals].sort((a, b) => a - b))
    expect(new Set(intervals).size).toBe(3)
  })
})

describe('every transition reports itself', () => {
  it('carries from, to and a reason for a log or a webhook', () => {
    const result = transition(domain('pending'), 'pass', NOW)
    expect(result.reason).toBeTruthy()
    expect(result).toHaveProperty('from')
    expect(result).toHaveProperty('to')
  })
})
