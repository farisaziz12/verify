import { describe, expect, it } from 'vitest'
import type { QueryOutcome } from '@/lib/dns/types'
import { DIAGNOSES, DIAGNOSIS_CODES } from './codes'
import { diagnose } from './diagnose'

const TOKEN = 'verify=abcdefghijklmnopqrstuvwxyz'

const answered = (...values: string[]): QueryOutcome => ({
  kind: 'answered',
  records: values.map((value) => ({ value })),
  ttl: 300,
})
const nxdomain = (negativeTtl: number | null = 60): QueryOutcome => ({
  kind: 'nxdomain',
  negativeTtl,
})
const nodata = (negativeTtl: number | null = 60): QueryOutcome => ({ kind: 'nodata', negativeTtl })
const failed = (reason: 'timeout' | 'servfail' | 'network' | 'malformed'): QueryOutcome => ({
  kind: 'error',
  reason,
})

const EXPECTED_NAME = '_claim.example.com'
const PROBE_NAME = '_claim.example.com.example.com'

function run(primary: QueryOutcome, probe: QueryOutcome | null = null, claimAgeMs = 0) {
  return diagnose({
    primary,
    probe,
    expectedValue: TOKEN,
    expectedName: EXPECTED_NAME,
    probeName: PROBE_NAME,
    claimAgeMs,
  })
}

describe('each rung of the ladder', () => {
  it('1. the token at the right name verifies', () => {
    expect(run(answered(TOKEN)).code).toBe('VERIFIED_OK')
  })

  it('1. finds the token among unrelated records', () => {
    expect(run(answered('v=spf1 -all', TOKEN, 'google-site-verification=x')).code).toBe(
      'VERIFIED_OK',
    )
  })

  it('2. the token at the doubled name is an appended zone', () => {
    const diagnosis = run(nodata(), answered(TOKEN))
    expect(diagnosis.code).toBe('ZONE_NAME_APPENDED')
    // The value is right; the evidence is the pair of names, not the pair of values.
    expect(diagnosis.evidence).toEqual({ expected: EXPECTED_NAME, found: [PROBE_NAME] })
  })

  it('3. records that exist but do not match', () => {
    const diagnosis = run(answered('verify=somethingelse'))
    expect(diagnosis.code).toBe('TOKEN_MISMATCH')
    expect(diagnosis.evidence).toEqual({ expected: TOKEN, found: ['verify=somethingelse'] })
  })

  it('4. nxdomain means the name was never created', () => {
    expect(run(nxdomain()).code).toBe('RECORD_NAME_MISSING')
  })

  it('5. nodata means the name exists without TXT', () => {
    expect(run(nodata()).code).toBe('RECORD_NOT_FOUND')
  })

  it('6. a query error is indeterminate, never a failure', () => {
    const diagnosis = run(failed('timeout'))
    expect(diagnosis.code).toBe('DNS_UNREACHABLE')
    expect(diagnosis.verdict).toBe('indeterminate')
    expect(diagnosis.evidence).toEqual({ reason: 'timeout' })
  })
})

describe('precedence — the order is the contract', () => {
  it('a match at the right name beats a match at the doubled name', () => {
    expect(run(answered(TOKEN), answered(TOKEN)).code).toBe('VERIFIED_OK')
  })

  // The doubled-name fix is the real fix even when a stale value also sits at the right name.
  it('appended beats mismatch', () => {
    expect(run(answered('verify=stale'), answered(TOKEN)).code).toBe('ZONE_NAME_APPENDED')
  })

  it('a mismatch at the right name beats absence at the doubled name', () => {
    expect(run(answered('verify=stale'), nxdomain()).code).toBe('TOKEN_MISMATCH')
  })

  // A resolver failure on the probe must not turn a real primary answer into an error.
  it('a failed probe does not override what the primary told us', () => {
    expect(run(answered('verify=stale'), failed('servfail')).code).toBe('TOKEN_MISMATCH')
    expect(run(nodata(), failed('timeout')).code).toBe('RECORD_NOT_FOUND')
  })
})

describe('the negative-cache advisory', () => {
  const LONG_TTL = 86_400 // what Cloudflare actually returned for a NODATA in our fixtures

  it('explains a long-cached absence on a young claim', () => {
    const diagnosis = run(nodata(LONG_TTL), null, 60_000)
    expect(diagnosis.notes?.[0]).toMatch(/may remember this record's absence/)
    expect(diagnosis.notes?.[0]).toContain('1440 minutes')
  })

  it('attaches to nxdomain too', () => {
    expect(run(nxdomain(LONG_TTL), null, 60_000).notes).toHaveLength(1)
  })

  it('stays quiet once the claim is old enough that caching cannot be the cause', () => {
    expect(run(nodata(LONG_TTL), null, LONG_TTL * 2 * 1000 + 1).notes).toBeUndefined()
  })

  it('stays quiet for a short TTL, which expires before anyone notices', () => {
    expect(run(nodata(60), null, 0).notes).toBeUndefined()
  })

  it('stays quiet when the resolver gave no SOA', () => {
    expect(run(nodata(null), null, 0).notes).toBeUndefined()
  })

  it('never changes the code or verdict', () => {
    const withNote = run(nodata(LONG_TTL), null, 0)
    const withoutNote = run(nodata(60), null, 0)
    expect(withNote.code).toBe(withoutNote.code)
    expect(withNote.verdict).toBe(withoutNote.verdict)
  })
})

describe('the registry', () => {
  it('every code is reachable from some input', () => {
    const produced = new Set([
      run(answered(TOKEN)).code,
      run(nodata(), answered(TOKEN)).code,
      run(answered('verify=other')).code,
      run(nxdomain()).code,
      run(nodata()).code,
      run(failed('network')).code,
    ])
    expect([...produced].sort()).toEqual([...DIAGNOSIS_CODES].sort())
  })

  it('verdicts come from the registry, not from the ladder', () => {
    for (const code of DIAGNOSIS_CODES) {
      expect(DIAGNOSES[code].verdict).toBeDefined()
    }
    expect(DIAGNOSES.VERIFIED_OK.action).toBeNull()
    expect(DIAGNOSES.DNS_UNREACHABLE.action).toBeNull()
  })
})
