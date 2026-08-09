'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { Domain } from '@/lib/db/schema'
import { apiFetch } from '@/lib/query/fetcher'
import { queryKeys } from '@/lib/query/keys'

export interface ClaimResult {
  domain: Domain
  record: { name: string; value: string }
}

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
      apiFetch<ClaimResult>('/api/domains', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.domains.all() })
      router.push('/')
    },
  })
}
