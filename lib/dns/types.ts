export type QueryFailureReason = 'timeout' | 'servfail' | 'network' | 'malformed'

export type QueryOutcome =
  | { kind: 'answered'; records: TxtRecord[]; ttl: number }
  | { kind: 'nodata'; negativeTtl: number | null }
  | { kind: 'nxdomain'; negativeTtl: number | null }
  | { kind: 'error'; reason: QueryFailureReason }

export interface TxtRecord {
  value: string
}

export type RecordType = 'TXT' | 'NS'

export interface QueryResult {
  outcome: QueryOutcome
  /** The adapter that actually answered, not necessarily the one queried. */
  resolver: string
}

export interface Resolver {
  readonly name: string
  query(name: string, type: RecordType): Promise<QueryResult>
}

/** One query, kept for the user-visible trail. */
export interface Lookup {
  name: string
  purpose: string
  resolver: string
  outcome: QueryOutcome
  latencyMs: number
}
