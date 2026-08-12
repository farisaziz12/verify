import { describe, expect, it } from 'vitest'
import {
  DAY,
  formatClockTime,
  formatCoarseDuration,
  formatCountdown,
  formatRelative,
  HOUR,
  MINUTE,
  SECOND,
  secondsFromNow,
  secondsUntil,
} from './time'

/** Fixed so nothing here depends on when the suite runs. */
const NOW = new Date('2026-08-09T12:00:00.000Z').getTime()
const at = (offsetMs: number) => new Date(NOW + offsetMs)

describe('constants', () => {
  it('are milliseconds, so they compose with getTime()', () => {
    expect([SECOND, MINUTE, HOUR, DAY]).toEqual([1000, 60_000, 3_600_000, 86_400_000])
  })
})

describe('secondsFromNow', () => {
  it('is positive for the future and negative for the past', () => {
    expect(secondsFromNow(at(30 * SECOND), NOW)).toBe(30)
    expect(secondsFromNow(at(-30 * SECOND), NOW)).toBe(-30)
  })

  it('rounds to the nearest second', () => {
    expect(secondsFromNow(at(1400), NOW)).toBe(1)
    expect(secondsFromNow(at(1600), NOW)).toBe(2)
  })
})

describe('secondsUntil', () => {
  it('floors at zero rather than counting past due', () => {
    expect(secondsUntil(at(-5 * MINUTE), NOW)).toBe(0)
  })

  it('agrees with secondsFromNow while the target is still ahead', () => {
    expect(secondsUntil(at(45 * SECOND), NOW)).toBe(45)
  })
})

describe('formatCountdown', () => {
  it('uses bare seconds below a minute', () => {
    expect(formatCountdown(0)).toBe('0s')
    expect(formatCountdown(59)).toBe('59s')
  })

  it('switches to m:ss at a minute, zero-padding the seconds', () => {
    expect(formatCountdown(60)).toBe('1:00')
    expect(formatCountdown(90)).toBe('1:30')
    expect(formatCountdown(605)).toBe('10:05')
  })
})

describe('formatRelative', () => {
  it('calls anything within ten seconds "just now", in either direction', () => {
    expect(formatRelative(at(3 * SECOND), NOW)).toBe('just now')
    expect(formatRelative(at(-3 * SECOND), NOW)).toBe('just now')
  })

  it('coarsens as the magnitude grows', () => {
    expect(formatRelative(at(-45 * SECOND), NOW)).toBe('45s ago')
    expect(formatRelative(at(-5 * MINUTE), NOW)).toBe('5m ago')
    expect(formatRelative(at(-3 * HOUR), NOW)).toBe('3h ago')
    expect(formatRelative(at(-2 * DAY), NOW)).toBe('2d ago')
  })

  it('phrases the future with a leading "in"', () => {
    expect(formatRelative(at(5 * MINUTE), NOW)).toBe('in 5m')
    expect(formatRelative(at(24 * HOUR), NOW)).toBe('in 1d')
  })

  it('truncates rather than rounds up, so a time never reads as further away than it is', () => {
    expect(formatRelative(at(-119 * SECOND), NOW)).toBe('1m ago')
  })
})

describe('formatClockTime', () => {
  it('is 24-hour with two digits in every field', () => {
    expect(formatClockTime(new Date(NOW))).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })
})

describe('formatCoarseDuration', () => {
  it('stays in minutes while the number is small', () => {
    expect(formatCoarseDuration(5 * MINUTE)).toBe('5 minutes')
    expect(formatCoarseDuration(60 * MINUTE)).toBe('60 minutes')
  })

  it('switches to hours rather than reporting 1440 minutes', () => {
    expect(formatCoarseDuration(2 * HOUR)).toBe('2 hours')
    expect(formatCoarseDuration(24 * HOUR)).toBe('24 hours')
  })

  it('reaches days only once hours would read as a large number', () => {
    expect(formatCoarseDuration(3 * DAY)).toBe('3 days')
  })

  it('singularises', () => {
    expect(formatCoarseDuration(MINUTE)).toBe('1 minute')
    expect(formatCoarseDuration(2 * DAY)).toBe('2 days')
  })

  it('rounds a partial minute up, so a wait is never understated', () => {
    expect(formatCoarseDuration(90 * SECOND)).toBe('2 minutes')
  })
})
