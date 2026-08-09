import type { QueryResult, RecordType, Resolver } from './types'

/**
 * Queries `primary`, falling back to `backup` only when the primary fails to answer.
 *
 * Failover is triggered by `kind: 'error'` and nothing else. `nxdomain` and `nodata` are real
 * answers — retrying them against a second resolver would be seeking a second opinion, which
 * is consensus, and consensus is deliberately out of scope (DECISIONS D2).
 *
 * The result reports whichever adapter actually answered, so the query trail can show that
 * the backup was used.
 */
export function withFailover(primary: Resolver, backup: Resolver): Resolver {
  return {
    name: `${primary.name}->${backup.name}`,
    async query(name: string, type: RecordType): Promise<QueryResult> {
      const result = await primary.query(name, type)
      if (result.outcome.kind !== 'error') return result
      return backup.query(name, type)
    },
  }
}
