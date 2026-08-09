'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { checkResultSchema } from '@/lib/db/wire'
import { ApiRequestError, apiFetch } from '@/lib/query/fetcher'
import { queryKeys } from '@/lib/query/keys'
import { SECOND } from '@/lib/time'

/**
 * Runs a check now, then refreshes everything that could have changed.
 *
 * Invalidates the root key rather than this domain's: a check can flip the status, which the
 * list renders too, so refreshing only the detail would leave the list stale behind it.
 *
 * Also surfaces `retryAfterSeconds`, counted down locally from the 429 the API returns. The
 * cooldown is therefore the server’s real rate-limit window rather than a timer the UI
 * invents and hopes matches.
 */
export function useRunCheck(id: string) {
  const queryClient = useQueryClient()
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null)

  const mutation = useMutation({
    mutationFn: () => apiFetch(`/api/domains/${id}/checks`, checkResultSchema, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.domains.all() }),
    // Only a 429 carries a cooldown. Anything else leaves a running one alone — a network
    // blip mid-countdown must not hand the button back before the server would accept it.
    onError: (error) => {
      const seconds = retryAfterFrom(error)
      if (seconds !== null) setRetryAfterSeconds(seconds)
    },
  })

  useEffect(() => {
    if (retryAfterSeconds === null) return
    if (retryAfterSeconds <= 0) {
      setRetryAfterSeconds(null)
      return
    }
    const timer = setTimeout(() => setRetryAfterSeconds((seconds) => (seconds ?? 1) - 1), SECOND)
    return () => clearTimeout(timer)
  }, [retryAfterSeconds])

  return { ...mutation, retryAfterSeconds }
}

function retryAfterFrom(error: unknown): number | null {
  if (!(error instanceof ApiRequestError) || error.status !== 429) return null
  const seconds = error.meta?.retryAfterSeconds
  return typeof seconds === 'number' ? seconds : null
}
