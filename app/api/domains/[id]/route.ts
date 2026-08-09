import { z } from 'zod'
import { fail, ok } from '@/lib/api/response'
import { getDomain } from '@/lib/db/queries'
import { recordName, recordValue } from '@/lib/verification/token'

const paramsSchema = z.object({ id: z.uuid('That is not a valid domain id.') })

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = paramsSchema.safeParse(await context.params)
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? 'Invalid id.', 'id')

  const domain = await getDomain(parsed.data.id)
  if (!domain) return fail(404, 'That domain does not exist.')

  return ok({
    domain,
    record: { name: recordName(domain.name), value: recordValue(domain.token) },
  })
}
