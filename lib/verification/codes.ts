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

/**
 * What a check concluded about the record, independent of what we then do about it.
 *
 * `warn` is deliberately absent: with a single required record nothing is simultaneously
 * acceptable and concerning. It would arrive with multi-record checks.
 */
export type Verdict = 'pass' | 'fail' | 'indeterminate'

export interface Diagnosis {
  verdict: Verdict
  tone: StatusTone
  /** The verdict, on the detail screen. */
  headline: string
  /** The same verdict in a list row, where there is one column and no space to explain. */
  rowWord: string
  /** How it reads in the activity log, phrased as something that happened. */
  logTitle: string
  /** One sentence, written so a support reply could quote it unchanged. */
  summary: string
  /** The single next thing the user should do, or null when there is nothing to do. */
  action: string | null
}

/**
 * Everything each diagnosis needs to be shown, in one table.
 *
 * `satisfies` over the code union means adding a code without deciding how it reads fails the
 * build — and because verdict and copy live together, it fails once rather than in four
 * places that each know part of the answer.
 *
 * A `fail` on a pending domain is setup-in-progress, not alarm — which is why
 * `RECORD_NOT_FOUND` is `pending` blue rather than amber. Nothing is wrong yet.
 */
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

/**
 * How a domain reads on screen, wherever it appears.
 *
 * A lifecycle status alone is not actionable — three different problems all sit under
 * "pending" — so the most recent diagnosis wins while the domain is still being worked on.
 *
 * Used where one word has to stand for the whole domain: the detail header and the list row.
 * The status card sits next to the evidence and has room for the full `headline`, so it reads
 * `DIAGNOSES` directly rather than going through here.
 */
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

/**
 * Everything the status card renders, decided once.
 *
 * Four visual decisions follow from the same pair of facts, so they are resolved here rather
 * than re-derived at each use site.
 */
export interface CheckStatusView {
  headline: string
  /** Colours the dot. Ignored when `showsVerified`, which renders a tick instead. */
  tone: StatusTone
  /** The sentence behind the info tip, or null before the first check. */
  summary: string | null
  /** The single next thing to do, or null when there is nothing. */
  action: string | null
  /** Render the verified treatment: tick, green ring, and the last-verified line. */
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

  // A query that did not complete is not news about a verified domain, so it does not get to
  // change what the card says.
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

/**
 * A domain that passed once and whose most recent check disagrees.
 *
 * `indeterminate` does not count: a query we could not complete says nothing about the record,
 * so it must not make a verified domain look broken.
 */
export function hasStaleRecord(status: DomainStatus, code: DiagnosisCode | null): boolean {
  return status === 'verified' && code !== null && DIAGNOSES[code].verdict === 'fail'
}

/**
 * Which of the three setup steps the user has reached.
 *
 * Finding any TXT record at the right name proves step 1 is done, even when the value is
 * wrong — so a mismatch is further along than an absence.
 */
export function stageFor(status: DomainStatus, code: DiagnosisCode | null): 1 | 2 | 3 {
  // Setup is done once a domain is verified, whatever a later check found.
  if (status === 'verified') return 3
  if (code === 'VERIFIED_OK') return 3
  if (code === 'TOKEN_MISMATCH' || code === 'ZONE_NAME_APPENDED') return 2
  return 1
}
