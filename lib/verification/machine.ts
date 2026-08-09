import type { Domain, DomainStatus } from '@/lib/db/schema'
import { HOUR, MINUTE, SECOND } from '@/lib/time'
import type { Verdict } from './codes'

// ─── When to look again ──────────────────────────────────────────────────────

/** A pending claim is re-checked on a widening schedule. First row not yet reached wins. */
const PENDING_SCHEDULE = [
  { untilAgeMs: 15 * MINUTE, everyMs: 30 * SECOND },
  { untilAgeMs: 2 * HOUR, everyMs: 5 * MINUTE },
] as const

/** The tier past every row above, where an abandoned claim spends the rest of its life. */
const OLDEST_PENDING_INTERVAL_MS = HOUR

const VERIFIED_INTERVAL_MS = 24 * HOUR

/** `next_check_at` for a status nothing will move again. Never null, so the index stays usable. */
export const FAR_FUTURE = new Date('9999-01-01T00:00:00Z')

// ─── Shapes ──────────────────────────────────────────────────────────────────

type Lifecycle = Pick<Domain, 'status' | 'claimedAt'>

/** The columns a transition writes. The new status is `Transition.to`, not repeated here. */
export interface TransitionChanges {
  nextCheckAt: Date
  verifiedAt?: Date
}

export interface Transition {
  from: DomainStatus
  to: DomainStatus
  /** Why, in a form a log line or a future webhook could carry unchanged. */
  reason: string
  changes: TransitionChanges
}

// ─── The machine ─────────────────────────────────────────────────────────────

/**
 * The only producer of a status change; the caller persists it.
 *
 * A check is the only thing that moves a domain, and it moves it in one direction: a pass
 * verifies. Anything else leaves the status alone and only buys another interval, so a
 * verified domain never demotes.
 */
export function transition(domain: Lifecycle, verdict: Verdict, now: Date): Transition {
  const from = domain.status

  if (verdict === 'pass' && (from === 'pending' || from === 'verified')) {
    return {
      from,
      to: 'verified',
      reason: from === 'pending' ? 'record found and matched' : 're-verified',
      changes: {
        nextCheckAt: after(now, VERIFIED_INTERVAL_MS),
        // Stamped once, when it is first earned.
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

// ─── Scheduling ──────────────────────────────────────────────────────────────

/** When a domain that did not move should be looked at again. */
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
