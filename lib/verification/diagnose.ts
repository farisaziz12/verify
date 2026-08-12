import type { QueryFailureReason, QueryOutcome } from '@/lib/dns/types'
import { formatCoarseDuration, SECOND } from '@/lib/time'
import { DIAGNOSES, type DiagnosisCode, type Verdict } from './codes'

/** Below this, a negative answer expires before a user would notice it. */
const ADVISORY_TTL_THRESHOLD_SECONDS = 300

/** What we expected against what we found — the pair a failed check is explained by. */
export interface ComparisonEvidence {
  expected: string
  found: string[]
}

/** Why a lookup could not be completed. Carries no claim about the record. */
export interface FailureEvidence {
  reason: QueryFailureReason
}

export type DiagnosisEvidence = ComparisonEvidence | FailureEvidence

/** Narrows evidence to the comparison form, which is the only one the UI renders as a diff. */
export function isComparison(evidence: DiagnosisEvidence | null): evidence is ComparisonEvidence {
  return evidence !== null && 'expected' in evidence
}

export interface Diagnosis {
  code: DiagnosisCode
  verdict: Verdict
  evidence?: DiagnosisEvidence
  /** Advisory lines. Never change the code or verdict. */
  notes?: string[]
}

export interface DiagnoseInput {
  /** TXT at `_claim.<domain>`. */
  primary: QueryOutcome
  /** TXT at the doubled name, or null when the primary already matched. */
  probe: QueryOutcome | null
  /** The exact string the record must hold, i.e. `verify=<token>`. */
  expectedValue: string
  /** The name that should hold it, i.e. `_claim.<domain>`. Reported as evidence. */
  expectedName: string
  /** The doubled name the probe asked for, reported when it is where the token turned up. */
  probeName: string
  /** How long ago the domain was claimed; drives the negative-cache advisory. */
  claimAgeMs: number
}

/**
 * First match wins, in this order: match, appended, mismatch, absence.
 *
 * `DNS_UNREACHABLE` is `indeterminate`, never `fail`.
 */
export function diagnose(input: DiagnoseInput): Diagnosis {
  const { primary, probe, expectedValue } = input

  if (primary.kind === 'answered' && hasValue(primary, expectedValue)) {
    return build('VERIFIED_OK')
  }

  if (probe?.kind === 'answered' && hasValue(probe, expectedValue)) {
    // The evidence here is the pair of names, not values — the value is correct, it is just
    // one level too deep.
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
