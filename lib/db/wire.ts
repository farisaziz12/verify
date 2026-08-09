import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import type { QueryOutcome } from '@/lib/dns/types'
import { DIAGNOSIS_CODES } from '@/lib/verification/codes'
import type { DiagnosisEvidence } from '@/lib/verification/diagnose'
import { checks, domains } from './schema'

// Wire shapes after JSON. `satisfies z.ZodType<T>` catches a wrong union member, not a
// missing one — the round-trip specs cover that direction.

export const queryOutcomeSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('answered'),
    records: z.array(z.object({ value: z.string() })),
    ttl: z.number(),
  }),
  z.object({ kind: z.literal('nodata'), negativeTtl: z.number().nullable() }),
  z.object({ kind: z.literal('nxdomain'), negativeTtl: z.number().nullable() }),
  z.object({
    kind: z.literal('error'),
    reason: z.enum(['timeout', 'servfail', 'network', 'malformed']),
  }),
]) satisfies z.ZodType<QueryOutcome>

const lookupSchema = z.object({
  name: z.string(),
  purpose: z.string(),
  resolver: z.string(),
  outcome: queryOutcomeSchema,
  latencyMs: z.number(),
})

export const evidenceSchema = z.union([
  z.object({ expected: z.string(), found: z.array(z.string()) }),
  z.object({ reason: z.enum(['timeout', 'servfail', 'network', 'malformed']) }),
]) satisfies z.ZodType<DiagnosisEvidence>

/** Timestamps arrive as ISO strings and are coerced back to `Date`. */
export const domainSchema = createSelectSchema(domains, {
  nextCheckAt: z.coerce.date(),
  claimedAt: z.coerce.date(),
  verifiedAt: z.coerce.date().nullable(),
  failingSince: z.coerce.date().nullable(),
  lastCheckedAt: z.coerce.date().nullable(),
})

export const checkSchema = createSelectSchema(checks, {
  startedAt: z.coerce.date(),
  finishedAt: z.coerce.date(),
  lookups: z.array(lookupSchema),
  diagnosisCode: z.enum(DIAGNOSIS_CODES),
  evidence: evidenceSchema.nullable(),
  notes: z.array(z.string()).nullable(),
})

export const recordSchema = z.object({ name: z.string(), value: z.string() })

export const domainListSchema = z.array(
  z.object({
    domain: domainSchema,
    latestDiagnosis: z.enum(DIAGNOSIS_CODES).nullable(),
  }),
)

export const domainDetailSchema = z.object({
  domain: domainSchema,
  record: recordSchema,
  latestCheck: checkSchema.nullable(),
})

/**
 * A check request's result.
 *
 * `checked: false` is the ordinary answer for an automatic check on a domain that was not
 * due — nothing ran, so there is no check and no new status.
 *
 * `nextCheckAt` is present either way, and is when the domain next becomes due. It is the
 * server telling the caller when to come back, so a polling client never has to guess a
 * cadence the server owns.
 */
export const checkResultSchema = z.discriminatedUnion('checked', [
  z.object({
    checked: z.literal(true),
    check: checkSchema,
    status: domainSchema.shape.status,
    nextCheckAt: z.coerce.date(),
  }),
  z.object({ checked: z.literal(false), nextCheckAt: z.coerce.date() }),
])

export const claimResultSchema = z.object({ domain: domainSchema, record: recordSchema })

export const checkListSchema = z.array(checkSchema)
