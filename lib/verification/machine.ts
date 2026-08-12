import type { Domain, DomainStatus } from '@/lib/db/schema'
import { HOUR, MINUTE, SECOND } from '@/lib/time'
import type { Verdict } from './codes'

/** Ordered widest-last; the first row whose `untilAgeMs` is not yet reached wins. */
const PENDING_SCHEDULE = [
  { untilAgeMs: 15 * MINUTE, everyMs: 30 * SECOND },
  { untilAgeMs: 2 * HOUR, everyMs: 5 * MINUTE },
] as const

const OLDEST_PENDING_INTERVAL_MS = HOUR

const VERIFIED_INTERVAL_MS = 24 * HOUR

/** `next_check_at` for a terminal status. */
export const FAR_FUTURE = new Date('9999-01-01T00:00:00Z')

type Lifecycle = Pick<Domain, 'status' | 'claimedAt'>

export interface TransitionChanges {
  nextCheckAt: Date
  verifiedAt?: Date
}

export interface Transition {
  from: DomainStatus
  to: DomainStatus
  reason: string
  changes: TransitionChanges
}

/** The only producer of a status change; the caller persists it. */
export function transition(domain: Lifecycle, verdict: Verdict, now: Date): Transition {
  const from = domain.status

  if (verdict === 'pass' && (from === 'pending' || from === 'verified')) {
    return {
      from,
      to: 'verified',
      reason: from === 'pending' ? 'record found and matched' : 're-verified',
      changes: {
        nextCheckAt: after(now, VERIFIED_INTERVAL_MS),
        ...(from === 'pending' ? { verifiedAt: now } : {}),
      },
    }
  }

  return {
    from,
    to: from,
    reason: `check returned ${verdict}`,
    changes: { nextCheckAt: rescheduled(domain, now) },
  }
}

function rescheduled(domain: Lifecycle, now: Date): Date {
  if (domain.status === 'verified') return after(now, VERIFIED_INTERVAL_MS)
  if (domain.status !== 'pending') return FAR_FUTURE

  return after(now, pendingIntervalMs(now.getTime() - domain.claimedAt.getTime()))
}

function pendingIntervalMs(claimAgeMs: number): number {
  const tier = PENDING_SCHEDULE.find(({ untilAgeMs }) => claimAgeMs < untilAgeMs)
  return tier?.everyMs ?? OLDEST_PENDING_INTERVAL_MS
}

function after(now: Date, ms: number): Date {
  return new Date(now.getTime() + ms)
}
