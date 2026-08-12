'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Domain } from '@/lib/db/schema'
import { deleteResultSchema } from '@/lib/db/wire'
import { apiFetch } from '@/lib/query/fetcher'
import { queryKeys } from '@/lib/query/keys'

type ListRow = { domain: Domain; latestDiagnosis: string | null }

/** Removes a domain optimistically, rolling the list back on failure. Does not navigate. */
export function useDeleteDomain(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiFetch(`/api/domains/${id}`, deleteResultSchema, { method: 'DELETE' }),

    onMutate: async () => {
      const listKey = queryKeys.domains.list()
      await queryClient.cancelQueries({ queryKey: listKey })

      const previous = queryClient.getQueryData<ListRow[]>(listKey)
      queryClient.setQueryData<ListRow[]>(listKey, (rows) =>
        rows?.filter((row) => row.domain.id !== id),
      )
      return { previous }
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.domains.list(), context.previous)
      }
    },

    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.domains.detail(id) })
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.domains.list() }),
  })
}
