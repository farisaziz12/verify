import { z } from 'zod'
import { fail, ok } from '@/lib/api/response'
import {
  claimDueCheck,
  countManualChecksSince,
  getDomain,
  listChecks,
  recordCheck,
  TIMELINE_LENGTH,
} from '@/lib/db/queries'
import { defaultResolver } from '@/lib/dns'
import { MINUTE, SECOND } from '@/lib/time'
import { runCheck } from '@/lib/verification/engine'

const MANUAL_LIMIT = 5
const MANUAL_WINDOW_MS = 5 * MINUTE

const CLAIM_LEASE_MS = MINUTE

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

/** Runs whether or not the domain is due, within the manual rate limit. */
async function runManualCheck(id: string) {
  const domain = await getDomain(id)
  if (!domain) return fail(404, 'That domain does not exist.')

  const recent = await countManualChecksSince(domain.id, new Date(Date.now() - MANUAL_WINDOW_MS))
  if (recent.total >= MANUAL_LIMIT) {
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

/** No rate limit: `next_check_at` is the throttle — not due means no DNS query and no new row. */
async function runAutomaticCheck(id: string) {
  const claimed = await claimDueCheck(id, new Date(Date.now() + CLAIM_LEASE_MS))

  if (!claimed) {
    // Not due, or another request holds the lease.
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
