import type { DomainStatus } from '@/lib/db/schema'
import type { StatusTone } from '@/lib/tone'

export const DIAGNOSIS_CODES = [
  'VERIFIED_OK',
  'ZONE_NAME_APPENDED',
  'TOKEN_MISMATCH',
  'RECORD_NAME_MISSING',
  'RECORD_NOT_FOUND',
  'DNS_UNREACHABLE',
] as const

export type DiagnosisCode = (typeof DIAGNOSIS_CODES)[number]

export type Verdict = 'pass' | 'fail' | 'indeterminate'

export interface Diagnosis {
  verdict: Verdict
  tone: StatusTone
  headline: string
  rowWord: string
  logTitle: string
  summary: string
  /** Null when there is nothing for the user to do. */
  action: string | null
}

export const DIAGNOSES = {
  VERIFIED_OK: {
    verdict: 'pass',
    tone: 'verified',
    headline: 'Verified',
    rowWord: 'Verified',
    logTitle: 'Record matches — verified',
    summary: 'We found the TXT record and the value matches. This domain is yours.',
    action: null,
  },
  ZONE_NAME_APPENDED: {
    verdict: 'fail',
    tone: 'attention',
    headline: 'Record is at the wrong name',
    rowWord: 'Needs a fix',
    logTitle: 'Record found one level too deep',
    summary: 'Your provider appended your domain to the host you typed.',
    action: 'Edit the record and put just _claim in the host field.',
  },
  TOKEN_MISMATCH: {
    verdict: 'fail',
    tone: 'attention',
    headline: "Value doesn't match",
    rowWord: 'Needs a fix',
    logTitle: 'TXT record found, value does not match',
    summary: "A TXT record exists, but its value isn't the token we issued.",
    action: 'Replace the value with the token above, exactly as shown.',
  },
  RECORD_NAME_MISSING: {
    verdict: 'fail',
    tone: 'attention',
    headline: "Record name doesn't exist",
    rowWord: 'Needs a fix',
    logTitle: 'Record name does not exist',
    summary: 'Nothing is published at that name.',
    action:
      'Check the host field of your DNS record. It should read _claim, or the full name if your provider wants it.',
  },
  RECORD_NOT_FOUND: {
    verdict: 'fail',
    tone: 'pending',
    headline: 'Record not found yet',
    rowWord: 'Pending',
    logTitle: 'Name exists, no TXT records',
    summary: 'That name has no TXT records yet.',
    action: 'No action needed if you just added it — new records take a few minutes to appear.',
  },
  DNS_UNREACHABLE: {
    verdict: 'indeterminate',
    tone: 'inactive',
    headline: "Couldn't check",
    rowWord: "Couldn't check",
    logTitle: "Couldn't check",
    summary: "Our DNS query didn't complete. This says nothing about your record.",
    action: null,
  },
} as const satisfies Record<DiagnosisCode, Diagnosis>

/** The one word that stands for the whole domain, in the detail header and the list row. */
export function describeDomain(
  status: DomainStatus,
  latestDiagnosis: DiagnosisCode | null,
): { word: string; tone: StatusTone } {
  if (status === 'verified') return { word: 'Verified', tone: 'verified' }
  if (status === 'expired') return { word: 'Expired', tone: 'inactive' }
  if (status === 'revoked') return { word: 'Revoked', tone: 'inactive' }
  if (!latestDiagnosis) return { word: 'Pending', tone: 'pending' }

  const { rowWord, tone } = DIAGNOSES[latestDiagnosis]
  return { word: rowWord, tone }
}

export interface CheckStatusView {
  headline: string
  /** Ignored when `showsVerified`. */
  tone: StatusTone
  /** Null before the first check. */
  summary: string | null
  /** Null when there is nothing to do. */
  action: string | null
  showsVerified: boolean
}

export function describeCheckStatus(
  status: DomainStatus,
  code: DiagnosisCode | null,
): CheckStatusView {
  const verified = status === 'verified'

  if (!code) {
    return {
      headline: 'Not checked yet',
      tone: 'inactive',
      summary: null,
      action: null,
      showsVerified: false,
    }
  }

  const { headline, tone, summary, action, verdict } = DIAGNOSES[code]

  if (verified && verdict === 'indeterminate') {
    const ok = DIAGNOSES.VERIFIED_OK
    return {
      headline: ok.headline,
      tone: ok.tone,
      summary: ok.summary,
      action: null,
      showsVerified: true,
    }
  }

  if (hasStaleRecord(status, code)) {
    return {
      headline: 'Verified, but the record has changed',
      tone,
      summary,
      action,
      showsVerified: false,
    }
  }

  return { headline, tone, summary, action, showsVerified: verified }
}

/** Verified once, and the latest check failed; `indeterminate` does not count. */
export function hasStaleRecord(status: DomainStatus, code: DiagnosisCode | null): boolean {
  return status === 'verified' && code !== null && DIAGNOSES[code].verdict === 'fail'
}

/** Which of the three setup steps the user has reached. */
export function stageFor(status: DomainStatus, code: DiagnosisCode | null): 1 | 2 | 3 {
  if (status === 'verified') return 3
  if (code === 'VERIFIED_OK') return 3
  if (code === 'TOKEN_MISMATCH' || code === 'ZONE_NAME_APPENDED') return 2
  return 1
}
