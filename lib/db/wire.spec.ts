import { describe, expect, it } from 'vitest'
import type { QueryOutcome } from '@/lib/dns/types'
import type { DiagnosisEvidence } from '@/lib/verification/diagnose'
import { checkListSchema, domainDetailSchema, evidenceSchema, queryOutcomeSchema } from './wire'

/** A domain row as it arrives over the wire, with timestamps still ISO strings. */
const DOMAIN_ROW = {
  id: '019fe842-0000-7000-8000-000000000001',
  name: 'example.com',
  token: 'abc',
  status: 'pending',
  consecutiveFailures: 0,
  nextCheckAt: '2026-08-09T12:00:30.000Z',
  claimedAt: '2026-08-09T12:00:00.000Z',
  verifiedAt: null,
  failingSince: null,
  lastCheckedAt: null,
}

/**
 * One sample per union member, keyed by discriminant.
 *
 * The mapped type is the point: adding a `kind` to `QueryOutcome` without adding a sample
 * here fails to compile, so the table cannot fall behind the type it is covering. Parsing
 * each sample then proves the schema still accepts that member — the direction `satisfies`
 * cannot check, because a schema missing a member is still assignable to the wider union.
 */
const OUTCOMES: { [K in QueryOutcome['kind']]: Extract<QueryOutcome, { kind: K }> } = {
  answered: { kind: 'answered', records: [{ value: 'verify=abc' }], ttl: 300 },
  nodata: { kind: 'nodata', negativeTtl: 60 },
  nxdomain: { kind: 'nxdomain', negativeTtl: null },
  error: { kind: 'error', reason: 'timeout' },
}

describe('queryOutcomeSchema', () => {
  it.each(Object.entries(OUTCOMES))('round-trips a %s outcome', (_kind, outcome) => {
    expect(queryOutcomeSchema.parse(outcome)).toEqual(outcome)
  })

  it('rejects an unknown kind', () => {
    expect(queryOutcomeSchema.safeParse({ kind: 'refused' }).success).toBe(false)
  })

  it('rejects an answered outcome missing its records', () => {
    expect(queryOutcomeSchema.safeParse({ kind: 'answered', ttl: 300 }).success).toBe(false)
  })
})

const EVIDENCE: DiagnosisEvidence[] = [
  { expected: 'verify=abc', found: ['verify=xyz'] },
  { reason: 'servfail' },
]

describe('evidenceSchema', () => {
  it.each(EVIDENCE)('round-trips %o', (evidence) => {
    expect(evidenceSchema.parse(evidence)).toEqual(evidence)
  })

  it('rejects a shape that is neither comparison nor failure', () => {
    expect(evidenceSchema.safeParse({ note: 'something else' }).success).toBe(false)
  })
})

/** A stored row this client cannot read — a code from a newer deploy, or corruption. */
const UNREADABLE_CHECK = {
  id: '019fe842-0000-7000-8000-000000000000',
  domainId: '019fe842-0000-7000-8000-000000000001',
  trigger: 'manual',
  startedAt: '2026-08-09T12:00:00.000Z',
  finishedAt: '2026-08-09T12:00:00.100Z',
  lookups: [],
  verdict: 'fail',
  diagnosisCode: 'NOT_A_REAL_CODE',
  evidence: null,
  notes: null,
}

const READABLE_CHECK = { ...UNREADABLE_CHECK, diagnosisCode: 'VERIFIED_OK', verdict: 'pass' }

describe('degrading on a row this client cannot read', () => {
  it('keeps the detail page usable by dropping only the check', () => {
    const parsed = domainDetailSchema.safeParse({
      domain: DOMAIN_ROW,
      record: { name: '_claim.example.com', value: 'verify=abc' },
      latestCheck: UNREADABLE_CHECK,
    })

    expect(parsed.success).toBe(true)
    // The name and the record — what the user came for — survive.
    expect(parsed.data?.latestCheck).toBeNull()
    expect(parsed.data?.record.value).toBe('verify=abc')
  })

  it('keeps the readable rows of a timeline and drops the rest', () => {
    const timeline = checkListSchema.parse([READABLE_CHECK, UNREADABLE_CHECK, READABLE_CHECK])
    expect(timeline).toHaveLength(2)
    expect(timeline.every((check) => check.diagnosisCode === 'VERIFIED_OK')).toBe(true)
  })

  it('still rejects a detail payload whose domain is unreadable, which is not recoverable', () => {
    const parsed = domainDetailSchema.safeParse({
      domain: { ...DOMAIN_ROW, status: 'NOT_A_STATUS' },
      record: { name: '_claim.example.com', value: 'verify=abc' },
      latestCheck: null,
    })
    expect(parsed.success).toBe(false)
  })
})
