import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { fail, ok } from '@/lib/api/response'
import { createDomain, listDomains } from '@/lib/db/queries'
import { normalizeDomain } from '@/lib/domain/normalize'
import { recordName, recordValue } from '@/lib/verification/token'

const claimSchema = z.object({
  name: z.string().max(253, 'A domain name cannot exceed 253 characters.'),
})

export async function GET() {
  return ok(await listDomains())
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  const parsed = claimSchema.safeParse(body)
  if (!parsed.success) {
    return fail(400, parsed.error.issues[0]?.message ?? 'Invalid request body.', { field: 'name' })
  }

  const normalized = normalizeDomain(parsed.data.name)
  if (!normalized.ok) return fail(400, normalized.error, { field: 'name' })

  const domain = await createDomain(normalized.name)
  if (!domain) return fail(409, `${normalized.name} has already been claimed.`, { field: 'name' })

  return ok(
    {
      domain,
      record: { name: recordName(domain.name), value: recordValue(domain.token) },
    },
    { status: 201 },
  )
}
