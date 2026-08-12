import { queryOptions } from '@tanstack/react-query'
import { checkListSchema } from '@/lib/db/wire'
import { apiFetch } from '@/lib/query/fetcher'
import { queryKeys } from '@/lib/query/keys'

/** A domain's check history, newest first. */
export function checksQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.domains.checks(id),
    queryFn: () => apiFetch(`/api/domains/${id}/checks`, checkListSchema),
  })
}
