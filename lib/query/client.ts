import { environmentManager, QueryClient } from '@tanstack/react-query'
import { SECOND } from '@/lib/time'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * SECOND,
        retry: 1,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

/** A fresh client per request on the server; one shared client in the browser. */
export function getQueryClient(): QueryClient {
  if (environmentManager.isServer()) return makeQueryClient()
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}
