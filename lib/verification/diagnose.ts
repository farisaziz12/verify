import type { QueryFailureReason, QueryOutcome } from '@/lib/dns/types'
import { formatCoarseDuration, SECOND } from '@/lib/time'
import { DIAGNOSES, type DiagnosisCode, type Verdict } from './codes'

const ADVISORY_TTL_THRESHOLD_SECONDS = 300

export interface ComparisonEvidence {
  expected: string
  found: string[]
}

export interface FailureEvidence {
  reason: QueryFailureReason
}

export type DiagnosisEvidence = ComparisonEvidence | FailureEvidence

export function isComparison(evidence: DiagnosisEvidence | null): evidence is ComparisonEvidence {
  return evidence !== null && 'expected' in evidence
}

export interface Diagnosis {
  code: DiagnosisCode
  verdict: Verdict
  evidence?: DiagnosisEvidence
  notes?: string[]
}

export interface DiagnoseInput {
  /** TXT at `_claim.<domain>`. */
  primary: QueryOutcome
  /** TXT at the doubled name; null when the primary already matched. */
  probe: QueryOutcome | null
  expectedValue: string
  expectedName: string
  probeName: string
  /** Milliseconds since the claim. */
  claimAgeMs: number
}

/** First match wins, in this order: match, appended, mismatch, absence. */
export function diagnose(input: DiagnoseInput): Diagnosis {
  const { primary, probe, expectedValue } = input

  if (primary.kind === 'answered' && hasValue(primary, expectedValue)) {
    return build('VERIFIED_OK')
  }

  if (probe?.kind === 'answered' && hasValue(probe, expectedValue)) {
    return build('ZONE_NAME_APPENDED', {
      evidence: { expected: input.expectedName, found: [input.probeName] },
    })
  }

  if (primary.kind === 'answered') {
    return build('TOKEN_MISMATCH', {
      evidence: { expected: expectedValue, found: primary.records.map((r) => r.value) },
    })
  }

  if (primary.kind === 'nxdomain') {
    return build('RECORD_NAME_MISSING', { notes: cacheAdvisory(primary.negativeTtl, input) })
  }

  if (primary.kind === 'nodata') {
    return build('RECORD_NOT_FOUND', { notes: cacheAdvisory(primary.negativeTtl, input) })
  }

  return build('DNS_UNREACHABLE', { evidence: { reason: primary.reason } })
}

function hasValue(outcome: Extract<QueryOutcome, { kind: 'answered' }>, value: string): boolean {
  return outcome.records.some((record) => record.value === value)
}

function build(
  code: DiagnosisCode,
  extra: { evidence?: DiagnosisEvidence; notes?: string[] } = {},
): Diagnosis {
  const diagnosis: Diagnosis = { code, verdict: DIAGNOSES[code].verdict }
  if (extra.evidence) diagnosis.evidence = extra.evidence
  if (extra.notes?.length) diagnosis.notes = extra.notes
  return diagnosis
}

/** Empty below `ADVISORY_TTL_THRESHOLD_SECONDS`, or once the claim is older than 2x the TTL. */
function cacheAdvisory(negativeTtl: number | null, input: DiagnoseInput): string[] {
  if (negativeTtl === null || negativeTtl <= ADVISORY_TTL_THRESHOLD_SECONDS) return []
  if (input.claimAgeMs > negativeTtl * 2 * SECOND) return []

  return [
    `A resolver may remember this record's absence for up to ~${formatCoarseDuration(negativeTtl * SECOND)} after you add it. Nothing is wrong on your end.`,
  ]
}
