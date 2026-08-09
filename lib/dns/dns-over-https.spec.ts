import { describe, expect, it } from 'vitest'
import cfAnswered from './__fixtures__/cloudflare-answered.json'
import cfCnameInNxdomain from './__fixtures__/cloudflare-cname-in-nxdomain.json'
import cfCnamePollution from './__fixtures__/cloudflare-cname-pollution.json'
import cfMultiChunk from './__fixtures__/cloudflare-multi-chunk.json'
import cfNodata from './__fixtures__/cloudflare-nodata.json'
import cfNxdomain from './__fixtures__/cloudflare-nxdomain.json'
import cfServfail from './__fixtures__/cloudflare-servfail.json'
import goAnswered from './__fixtures__/google-answered.json'
import goCnamePollution from './__fixtures__/google-cname-pollution.json'
import goMultiChunk from './__fixtures__/google-multi-chunk.json'
import goNodata from './__fixtures__/google-nodata.json'
import goNxdomain from './__fixtures__/google-nxdomain.json'
import { classifyResponse } from './dns-over-https'
import { decodeCloudflareTxt, decodeGoogleTxt } from './presentation-format'

type DnsJsonBody = Parameters<typeof classifyResponse>[0]

const classifyAsCloudflare = (body: DnsJsonBody) => classifyResponse(body, decodeCloudflareTxt)
const classifyAsGoogle = (body: DnsJsonBody) => classifyResponse(body, decodeGoogleTxt)

describe('classifyResponse — answered', () => {
  it('returns every TXT record, decoded', () => {
    const outcome = classifyAsCloudflare(cfAnswered)
    expect(outcome.kind).toBe('answered')
    if (outcome.kind !== 'answered') return
    expect(outcome.records).toHaveLength(22)
    expect(outcome.records.every((r) => !r.value.startsWith('"'))).toBe(true)
    expect(outcome.ttl).toBeGreaterThan(0)
  })

  it('agrees across resolvers on the multi-chunk DKIM value', () => {
    const fromCloudflare = classifyAsCloudflare(cfMultiChunk)
    const fromGoogle = classifyAsGoogle(goMultiChunk)
    if (fromCloudflare.kind !== 'answered' || fromGoogle.kind !== 'answered') {
      throw new Error('expected both resolvers to answer')
    }

    const cloudflareValue = fromCloudflare.records[0]?.value
    expect(cloudflareValue).toHaveLength(410)
    expect(cloudflareValue).toBe(fromGoogle.records[0]?.value)
    expect(cloudflareValue).toMatch(/^v=DKIM1;/)
  })

  it('takes the shortest TTL, since that is when the answer first goes stale', () => {
    const outcome = classifyAsCloudflare({
      Status: 0,
      Answer: [
        { name: 'x', type: 16, TTL: 300, data: '"a"' },
        { name: 'x', type: 16, TTL: 60, data: '"b"' },
      ],
    })
    expect(outcome.kind === 'answered' && outcome.ttl).toBe(60)
  })
})

describe('classifyResponse — CNAME contamination', () => {
  // www.github.com returns 23 answers: one CNAME plus 22 TXT.
  it('drops type 5 records from an otherwise normal answer', () => {
    for (const outcome of [
      classifyAsCloudflare(cfCnamePollution),
      classifyAsGoogle(goCnamePollution),
    ]) {
      expect(outcome.kind).toBe('answered')
      if (outcome.kind !== 'answered') continue
      expect(outcome.records).toHaveLength(22)
    }
  })

  // A Status-3 response whose Answer holds a CNAME must still read as nxdomain, not answered.
  it('does not mistake a CNAME inside an NXDOMAIN for an answer', () => {
    const outcome = classifyAsCloudflare(cfCnameInNxdomain)
    expect(outcome.kind).toBe('nxdomain')
  })
})

describe('classifyResponse — negative answers', () => {
  it('reads NXDOMAIN from Status 3 and takes the SOA TTL', () => {
    for (const outcome of [classifyAsCloudflare(cfNxdomain), classifyAsGoogle(goNxdomain)]) {
      expect(outcome.kind).toBe('nxdomain')
      if (outcome.kind !== 'nxdomain') continue
      expect(outcome.negativeTtl).toBeGreaterThan(0)
    }
  })

  it('reads NODATA from Status 0 with no TXT answers', () => {
    for (const outcome of [classifyAsCloudflare(cfNodata), classifyAsGoogle(goNodata)]) {
      expect(outcome.kind).toBe('nodata')
      if (outcome.kind !== 'nodata') continue
      expect(outcome.negativeTtl).toBeGreaterThan(0)
    }
  })

  // The two resolvers genuinely disagree here — 86400 vs 1800 for the same query.
  it('preserves each resolver’s own negative TTL rather than normalising it', () => {
    const fromCloudflare = classifyAsCloudflare(cfNodata)
    const fromGoogle = classifyAsGoogle(goNodata)
    if (fromCloudflare.kind !== 'nodata' || fromGoogle.kind !== 'nodata') {
      throw new Error('expected both to be nodata')
    }
    expect(fromCloudflare.negativeTtl).not.toBe(fromGoogle.negativeTtl)
  })

  it('returns null when no SOA is present', () => {
    const outcome = classifyAsCloudflare({ Status: 0, Answer: [] })
    expect(outcome.kind === 'nodata' && outcome.negativeTtl).toBeNull()
  })
})

describe('classifyResponse — resolver failure', () => {
  it('maps SERVFAIL, which arrives as HTTP 200 with Status 2', () => {
    const outcome = classifyAsCloudflare(cfServfail)
    expect(outcome).toEqual({ kind: 'error', reason: 'servfail' })
  })

  it('treats any other non-zero status as a resolver failure', () => {
    expect(classifyAsCloudflare({ Status: 5 })).toEqual({ kind: 'error', reason: 'servfail' })
  })
})

describe('the observed wire contract', () => {
  it('Cloudflare quotes TXT values and Google does not', () => {
    const quoted = (f: { Answer?: { type: number; data: string }[] }) =>
      (f.Answer ?? []).filter((a) => a.type === 16).map((a) => a.data)
    expect(quoted(cfAnswered).every((d) => d.startsWith('"'))).toBe(true)
    expect(quoted(goAnswered).every((d) => !d.startsWith('"'))).toBe(true)
  })
})
