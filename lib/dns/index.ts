import { cloudflareResolver, googleResolver } from './dns-over-https'
import { withFailover } from './failover'
import type { Resolver } from './types'

/** Cloudflare, with Google standing by for when Cloudflare itself fails. */
export const defaultResolver: Resolver = withFailover(cloudflareResolver, googleResolver)

export { cloudflareResolver, googleResolver } from './dns-over-https'
export { withFailover } from './failover'
export type { Lookup, QueryOutcome, QueryResult, RecordType, Resolver, TxtRecord } from './types'
