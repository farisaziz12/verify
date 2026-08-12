'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Domain } from '@/lib/db/schema'
import { checkResultSchema } from '@/lib/db/wire'
import { isPending } from '@/lib/domain/status'
import { apiFetch } from '@/lib/query/fetcher'
import { queryKeys } from '@/lib/query/keys'
import { SECOND } from '@/lib/time'

/** Added to `nextCheckAt` so a request lands just after the domain is due. */
const DUE_MARGIN_MS = SECOND

/** Floor on any computed wait, so an overdue domain does not spin. */
const MIN_WAIT_MS = 5 * SECOND

/** Polls while the domain is `pending`. `nextAskAt` is when the next request leaves, margin and floor included. */
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
    retry: false,
    staleTime: 0,
    gcTime: 0,
  })

  return { isChecking: isFetching, isWatching: shouldWatch, nextAskAt: data?.nextAskAt ?? null }
}

function askAtFor(nextCheckAt: Date): Date {
  const waitMs = Math.max(MIN_WAIT_MS, nextCheckAt.getTime() - Date.now() + DUE_MARGIN_MS)
  return new Date(Date.now() + waitMs)
}
