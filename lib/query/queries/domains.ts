import { queryOptions } from '@tanstack/react-query'
import type { Domain } from '@/lib/db/schema'
import { apiFetch } from '@/lib/query/fetcher'
import { queryKeys } from '@/lib/query/keys'

const PENDING_POLL_MS = 10_000

/**
 * Whether anything in the system can move a domain out of `pending` on its own.
 *
 * Flip to `true` with the verification engine (PR 5). Typed as `boolean` rather than
 * inferred as the literal `false` so the guarded branch stays reachable to the compiler.
 */
const CHECKS_CAN_CHANGE_STATUS: boolean = false

/**
 * The claimed domains, newest first.
 *
 * Shared by the server prefetch and the client `useQuery` so both sides agree on the key,
 * the fetcher, and the freshness window.
 */
export function domainsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.domains.list(),
    queryFn: () => apiFetch<Domain[]>('/api/domains'),
    refetchInterval: (query) => (hasWorkInFlight(query.state.data) ? PENDING_POLL_MS : false),
  })
}

/**
 * Whether any domain could still change on its own, which is the only reason to poll.
 *
 * Self-terminating: once every domain reaches a settled state the interval returns `false`
 * and the timer stops, rather than polling a list that can no longer move.
 */
function hasWorkInFlight(domains: Domain[] | undefined): boolean {
  if (!CHECKS_CAN_CHANGE_STATUS || !domains) return false
  return domains.some((domain) => domain.status === 'pending')
}
