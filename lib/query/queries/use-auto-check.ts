'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Domain } from '@/lib/db/schema'
import { checkResultSchema } from '@/lib/db/wire'
import { isPending } from '@/lib/domain/status'
import { apiFetch } from '@/lib/query/fetcher'
import { queryKeys } from '@/lib/query/keys'
import { SECOND } from '@/lib/time'

/**
 * Pushes the target *later*: added to `nextCheckAt` so a request lands just after the domain
 * is due. Arriving a millisecond early is answered "not due", which halves the real rate.
 */
const DUE_MARGIN_MS = SECOND

/**
 * Bounds the result *lower*: the smallest wait, whatever the arithmetic produced. Applies
 * when `nextCheckAt` is already in the past — an overdue domain, or one another tab has
 * leased — where the computed wait would be zero or negative and polling would spin.
 */
const MIN_WAIT_MS = 5 * SECOND

/**
 * Polls while the domain is `pending`, waiting as long as the server's `nextCheckAt` says.
 *
 * `nextAskAt` is when the next request actually leaves, margin and floor included.
 */
export function useAutoCheck(domain: Domain) {
  const queryClient = useQueryClient()
  const shouldWatch = isPending(domain)

  const { isFetching, data } = useQuery({
    queryKey: queryKeys.autoCheck(domain.id),
    queryFn: async ({ signal }) => {
      const result = await apiFetch(`/api/domains/${domain.id}/checks`, checkResultSchema, {
        method: 'POST',
        body: JSON.stringify({ trigger: 'auto' }),
        signal,
      })

      if (result.checked) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.domains.all() })
      }
      return { nextAskAt: askAtFor(result.nextCheckAt) }
    },
    enabled: shouldWatch,
    refetchInterval: ({ state }) =>
      state.data ? Math.max(MIN_WAIT_MS, state.data.nextAskAt.getTime() - Date.now()) : false,
    // A failed background check is not the user's problem, and a retry storm would be.
    retry: false,
    // The answer is consumed as a schedule and never re-read, so caching it is meaningless.
    staleTime: 0,
    gcTime: 0,
  })

  return { isChecking: isFetching, isWatching: shouldWatch, nextAskAt: data?.nextAskAt ?? null }
}

function askAtFor(nextCheckAt: Date): Date {
  const waitMs = Math.max(MIN_WAIT_MS, nextCheckAt.getTime() - Date.now() + DUE_MARGIN_MS)
  return new Date(Date.now() + waitMs)
}
