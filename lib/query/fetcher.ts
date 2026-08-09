import type { Envelope } from '@/lib/api/response'

/** A non-2xx response, carrying the field the API blamed so a form can point at it. */
export class ApiRequestError extends Error {
  readonly status: number
  readonly field: string | undefined

  constructor(message: string, status: number, field?: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.field = field
  }
}

/**
 * Calls a route handler and unwraps the `{ data, error, meta }` envelope.
 *
 * Resolves an absolute origin when running on the server so the same call works during
 * prefetch and in the browser — one queryFn, not two implementations of the same read.
 *
 * @throws {ApiRequestError} on any non-2xx response, or on an unreachable server.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${origin()}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiRequestError('Could not reach the server. Check your connection.', 0)
  }

  const body = (await response.json().catch(() => null)) as Envelope<T> | null

  if (!response.ok) {
    throw new ApiRequestError(
      body?.error?.message ?? 'Something went wrong. Try again.',
      response.status,
      body?.error?.field,
    )
  }
  if (!body) {
    throw new ApiRequestError('The server returned an unreadable response.', response.status)
  }

  return body.data as T
}

/** Empty in the browser so requests stay relative; absolute on the server, which has no origin. */
function origin(): string {
  if (typeof window !== 'undefined') return ''
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}
