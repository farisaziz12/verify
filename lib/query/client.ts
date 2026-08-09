import { environmentManager, QueryClient } from '@tanstack/react-query'
import { SECOND } from '@/lib/time'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Non-zero so hydrated data is not thrown away and refetched the moment it lands.
        staleTime: 30 * SECOND,
        retry: 1,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

/**
 * A fresh client per request on the server; one shared client in the browser.
 *
 * Sharing a client across server requests would leak one user's cache into another's. In
 * the browser, remaking it would discard the cache whenever React suspends during the
 * initial render.
 */
export function getQueryClient(): QueryClient {
  if (environmentManager.isServer()) return makeQueryClient()
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}
