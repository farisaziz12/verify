import type { QueryResult, RecordType, Resolver } from './types'

/**
 * Queries `primary`, falling back to `backup` on `kind: 'error'` and nothing else.
 *
 * `nxdomain` and `nodata` are answers, not failures, so they are never retried.
 * The returned `resolver` names whichever adapter answered.
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
