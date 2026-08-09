import { z } from 'zod'
import { SECOND } from '@/lib/time'
import { decodeCloudflareTxt, decodeGoogleTxt } from './presentation-format'
import type { QueryOutcome, QueryResult, RecordType, Resolver } from './types'

const QUERY_TIMEOUT_MS = 3 * SECOND

const TYPE_TXT = 16
const TYPE_SOA = 6

const STATUS_NOERROR = 0
const STATUS_NXDOMAIN = 3

/**
 * The subset of the DoH JSON body this adapter reads. Unlisted fields (`TC`, `RD`, `Comment`)
 * are dropped. `Answer` and `Authority` are optional; a body missing `Status` is malformed.
 */
const dnsJsonRecordSchema = z.object({
  name: z.string(),
  type: z.number(),
  TTL: z.number().optional(),
  data: z.string(),
})

const dnsJsonResponseSchema = z.object({
  Status: z.number(),
  Answer: z.array(dnsJsonRecordSchema).optional(),
  Authority: z.array(dnsJsonRecordSchema).optional(),
})

type DnsJsonResponse = z.infer<typeof dnsJsonResponseSchema>

/**
 * Turns a DoH JSON body into a `QueryOutcome`.
 *
 * Exported for the adapter tests, which drive it with captured live responses rather than
 * hand-written objects.
 */
export function classifyResponse(
  body: DnsJsonResponse,
  decode: (data: string) => string,
): QueryOutcome {
  if (body.Status === STATUS_NXDOMAIN) {
    return { kind: 'nxdomain', negativeTtl: negativeTtlFromSoa(body) }
  }
  if (body.Status !== STATUS_NOERROR) {
    return { kind: 'error', reason: 'servfail' }
  }

  // Filtering to type 16 is not defensive tidying: CNAME records ride along in Answer, even
  // inside NXDOMAIN responses, and Answer may be absent entirely.
  const answers = (body.Answer ?? []).filter((record) => record.type === TYPE_TXT)
  if (answers.length === 0) {
    return { kind: 'nodata', negativeTtl: negativeTtlFromSoa(body) }
  }

  return {
    kind: 'answered',
    records: answers.map((record) => ({ value: decode(record.data) })),
    ttl: Math.min(...answers.map((record) => record.TTL ?? 0)),
  }
}

/** The remaining lifetime of a negative answer, read from the Authority section's SOA. */
function negativeTtlFromSoa(body: DnsJsonResponse): number | null {
  const soa = (body.Authority ?? []).find((record) => record.type === TYPE_SOA)
  return soa?.TTL ?? null
}

function createResolver(
  name: string,
  endpoint: string,
  decode: (data: string) => string,
): Resolver {
  return {
    name,
    async query(recordName: string, type: RecordType): Promise<QueryResult> {
      const url = `${endpoint}?name=${encodeURIComponent(recordName)}&type=${type}`

      // The only try/catch around DNS in the codebase: a thrown fetch becomes a value here
      // and nowhere else, which is what keeps DNS outcomes values rather than exceptions.
      // (`classifyResponse` also returns `kind: 'error'`, for answers that arrived but were
      // unusable — those never involved an exception.)
      try {
        const response = await fetch(url, {
          // Mandatory for Cloudflare, which returns 400 with an empty body without it.
          headers: { accept: 'application/dns-json' },
          // Explicit, not defensive: Next stopped caching fetch by default in 15, but a
          // verification product must never read a remembered answer, and that requirement
          // should not rest on a framework default that has already changed once.
          cache: 'no-store',
          signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
        })

        // A 400 carries JSON from Cloudflare and HTML from Google, so neither is parsed.
        if (!response.ok) {
          return { resolver: name, outcome: { kind: 'error', reason: 'malformed' } }
        }

        const body = dnsJsonResponseSchema.safeParse(await response.json())
        if (!body.success) {
          return { resolver: name, outcome: { kind: 'error', reason: 'malformed' } }
        }

        return { resolver: name, outcome: classifyResponse(body.data, decode) }
      } catch (error) {
        return { resolver: name, outcome: { kind: 'error', reason: failureReason(error) } }
      }
    },
  }
}

function failureReason(error: unknown): 'timeout' | 'network' | 'malformed' {
  if (error instanceof DOMException) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') return 'timeout'
  }
  // An unparseable body rejects with a SyntaxError; anything else failed at the socket.
  return error instanceof SyntaxError ? 'malformed' : 'network'
}

export const cloudflareResolver = createResolver(
  'cloudflare',
  'https://cloudflare-dns.com/dns-query',
  decodeCloudflareTxt,
)

export const googleResolver = createResolver(
  'google',
  'https://dns.google/resolve',
  decodeGoogleTxt,
)
