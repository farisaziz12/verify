/** DNS query results as values. */
export type QueryOutcome =
  | { kind: 'answered'; records: TxtRecord[]; ttl: number }
  | { kind: 'nodata'; negativeTtl: number | null }
  | { kind: 'nxdomain'; negativeTtl: number | null }
  | { kind: 'error'; reason: 'timeout' | 'servfail' | 'network' | 'malformed' }

export interface TxtRecord {
  value: string
}

export type RecordType = 'TXT' | 'NS'

/**
 * An outcome together with the adapter that produced it.
 *
 * The resolver is reported per query rather than read from `Resolver.name` because a
 * composed failover resolver answers as one of two adapters, and the trail has to say which.
 */
export interface QueryResult {
  outcome: QueryOutcome
  resolver: string
}

export interface Resolver {
  readonly name: string
  query(name: string, type: RecordType): Promise<QueryResult>
}

/** One query, kept for the user-visible trail. */
export interface Lookup {
  name: string
  /** Why this query was made. */
  purpose: string
  /** Which adapter answered. */
  resolver: string
  outcome: QueryOutcome
  latencyMs: number
}
