import { describe, expect, it } from 'vitest'
import type { QueryOutcome } from '@/lib/dns/types'
import type { DiagnosisEvidence } from '@/lib/verification/diagnose'
import { evidenceSchema, queryOutcomeSchema } from './wire'

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
