import { z } from 'zod'
import { fail, ok } from '@/lib/api/response'
import { deleteDomain, getDomain, latestCheck } from '@/lib/db/queries'
import { recordName, recordValue } from '@/lib/verification/token'

const paramsSchema = z.object({ id: z.uuid('That is not a valid domain id.') })

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = paramsSchema.safeParse(await context.params)
  if (!parsed.success)
    return fail(400, parsed.error.issues[0]?.message ?? 'Invalid id.', { field: 'id' })

  const domain = await getDomain(parsed.data.id)
  if (!domain) return fail(404, 'That domain does not exist.')

  return ok({
    domain,
    record: { name: recordName(domain.name), value: recordValue(domain.token) },
    latestCheck: await latestCheck(domain.id),
  })
}

/**
 * Removes a domain for good, along with its check history.
 *
 * The TXT record in the user's DNS is untouched — we cannot reach it, which is why the
 * confirmation says so. Deleting frees the name to be claimed again immediately.
 */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = paramsSchema.safeParse(await context.params)
  if (!parsed.success)
    return fail(400, parsed.error.issues[0]?.message ?? 'Invalid id.', { field: 'id' })

  const domain = await deleteDomain(parsed.data.id)
  if (!domain) return fail(404, 'That domain does not exist.')

  return ok({ domain })
}
