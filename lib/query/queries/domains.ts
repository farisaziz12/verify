import { queryOptions } from '@tanstack/react-query'
import { domainDetailSchema, domainListSchema } from '@/lib/db/wire'
import { isPending } from '@/lib/domain/status'
import { apiFetch } from '@/lib/query/fetcher'
import { queryKeys } from '@/lib/query/keys'
import { SECOND } from '@/lib/time'

const PENDING_POLL_MS = 10 * SECOND

/** Newest first. Refetches only while a row is still pending. */
export function domainsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.domains.list(),
    queryFn: () => apiFetch('/api/domains', domainListSchema),
    refetchInterval: (query) =>
      query.state.data?.some((row) => isPending(row.domain)) ? PENDING_POLL_MS : false,
  })
}

/** Never refetches on a timer; whoever runs a check invalidates this key. */
export function domainQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.domains.detail(id),
    queryFn: () => apiFetch(`/api/domains/${id}`, domainDetailSchema),
  })
}
