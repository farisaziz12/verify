import type { QueryResult, RecordType, Resolver } from './types'

/** Falls back to `backup` on `kind: 'error'` only; `nxdomain` and `nodata` are answers. */
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
