import { z } from 'zod'
import { fail, ok } from '@/lib/api/response'
import {
  claimDueCheck,
  countManualChecksSince,
  getDomain,
  listChecks,
  recordCheck,
} from '@/lib/db/queries'
import { defaultResolver } from '@/lib/dns'
import { MINUTE, SECOND } from '@/lib/time'
import { runCheck } from '@/lib/verification/engine'

/** A person may ask for a check 5 times per 5 minutes. Automatic checks are throttled by being due. */
const MANUAL_LIMIT = 5
const MANUAL_WINDOW_MS = 5 * MINUTE

/** How long a claimed check is held before another request may retry it. */
const CLAIM_LEASE_MS = MINUTE

/**
 * How many checks the timeline returns.
 *
 * The trail is for reading, not auditing: five is enough to show the shape of what happened
 * — a mismatch, a fix, a pass — without shipping every stored `lookups` trail on each poll.
 */
const TIMELINE_LENGTH = 5

const paramsSchema = z.object({ id: z.uuid('That is not a valid domain id.') })
const bodySchema = z.object({ trigger: z.enum(['manual', 'auto']).default('manual') })

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = paramsSchema.safeParse(await context.params)
  if (!parsed.success) {
    return fail(400, parsed.error.issues[0]?.message ?? 'Invalid id.', { field: 'id' })
  }

  const domain = await getDomain(parsed.data.id)
  if (!domain) return fail(404, 'That domain does not exist.')

  return ok(await listChecks(domain.id, TIMELINE_LENGTH))
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = paramsSchema.safeParse(await context.params)
  if (!parsed.success) {
    return fail(400, parsed.error.issues[0]?.message ?? 'Invalid id.', { field: 'id' })
  }

  const body = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!body.success) return fail(400, 'Invalid request body.')

  return body.data.trigger === 'auto'
    ? runAutomaticCheck(parsed.data.id)
    : runManualCheck(parsed.data.id)
}

/**
 * A check the user asked for.
 *
 * Runs whether or not the domain was due, within the limit that stops a held-down button
 * from becoming a DNS flood.
 */
async function runManualCheck(id: string) {
  const domain = await getDomain(id)
  if (!domain) return fail(404, 'That domain does not exist.')

  const recent = await countManualChecksSince(domain.id, new Date(Date.now() - MANUAL_WINDOW_MS))
  if (recent.total >= MANUAL_LIMIT) {
    // A slot frees up one window after the oldest check inside it, so that is when to retry.
    const retryAfterSeconds = recent.oldestAt
      ? Math.max(1, Math.ceil((recent.oldestAt.getTime() + MANUAL_WINDOW_MS - Date.now()) / 1000))
      : MANUAL_WINDOW_MS / SECOND

    return fail(
      429,
      `You can check ${MANUAL_LIMIT} times every ${MANUAL_WINDOW_MS / MINUTE} minutes.`,
      { meta: { retryAfterSeconds } },
    )
  }

  const outcome = await runCheck(domain, 'manual', { resolver: defaultResolver })
  const check = await recordCheck(outcome)

  return ok(
    {
      checked: true,
      check,
      status: outcome.transition.to,
      nextCheckAt: outcome.transition.changes.nextCheckAt,
    },
    { status: 201 },
  )
}

/**
 * A check the page ran on the user's behalf while they watch.
 *
 * Needs no rate limit because it only runs when the domain is actually due: `next_check_at`
 * is the throttle, and it widens as a claim ages. Not due means no DNS query and no new row.
 *
 * Both answers carry `nextCheckAt` so the caller can wait exactly that long instead of
 * polling on a fixed interval and being turned away most of the time.
 */
async function runAutomaticCheck(id: string) {
  const claimed = await claimDueCheck(id, new Date(Date.now() + CLAIM_LEASE_MS))

  if (!claimed) {
    // Not due, or another request holds the lease. Either way its `next_check_at` is when
    // to come back, which costs a read only on the path that did no DNS work.
    const domain = await getDomain(id)
    if (!domain) return fail(404, 'That domain does not exist.')

    return ok({ checked: false, nextCheckAt: domain.nextCheckAt })
  }

  const outcome = await runCheck(claimed, 'sweep', { resolver: defaultResolver })
  const check = await recordCheck(outcome)

  return ok(
    {
      checked: true,
      check,
      status: outcome.transition.to,
      nextCheckAt: outcome.transition.changes.nextCheckAt,
    },
    { status: 201 },
  )
}
