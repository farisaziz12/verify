'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { checkResultSchema } from '@/lib/db/wire'
import { ApiRequestError, apiFetch } from '@/lib/query/fetcher'
import { queryKeys } from '@/lib/query/keys'
import { SECOND } from '@/lib/time'

/** Runs a check now. `retryAfterSeconds` counts down the server's 429 window. */
export function useRunCheck(id: string) {
  const queryClient = useQueryClient()
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null)

  const mutation = useMutation({
    mutationFn: () => apiFetch(`/api/domains/${id}/checks`, checkResultSchema, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.domains.all() }),
    // Only a 429 carries a cooldown; anything else leaves a running one alone.
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
