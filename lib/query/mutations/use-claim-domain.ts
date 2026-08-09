'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { claimResultSchema } from '@/lib/db/wire'
import { apiFetch } from '@/lib/query/fetcher'
import { queryKeys } from '@/lib/query/keys'

/**
 * Claims a domain, then invalidates every domains query and returns to the list.
 *
 * Invalidation targets the root key, so a future detail or checks query is refreshed by
 * the same call without this hook learning about it.
 */
export function useClaimDomain() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (name: string) =>
      apiFetch('/api/domains', claimResultSchema, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.domains.all() })
      router.push('/')
    },
  })
}
