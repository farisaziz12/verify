import { z } from 'zod'

/** A non-2xx response. */
export class ApiRequestError extends Error {
  readonly status: number
  readonly field: string | undefined
  /** The envelope's `meta` — `retryAfterSeconds` on a 429, for instance. */
  readonly meta: Record<string, unknown> | null

  constructor(
    message: string,
    status: number,
    options?: { field?: string; meta?: Record<string, unknown> | null },
  ) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.field = options?.field
    this.meta = options?.meta ?? null
  }
}

const envelopeSchema = z.object({
  data: z.unknown(),
  error: z.object({ message: z.string(), field: z.string().optional() }).nullable(),
  meta: z.record(z.string(), z.unknown()).nullable(),
})

/** Unwraps the envelope and validates `data`; throws `ApiRequestError` on non-2xx, no server, or a shape mismatch. */
export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${origin()}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiRequestError('Could not reach the server. Check your connection.', 0)
  }

  const raw: unknown = await response.json().catch(() => null)
  const envelope = envelopeSchema.safeParse(raw)

  if (!response.ok) {
    const error = envelope.success ? envelope.data.error : null
    throw new ApiRequestError(
      error?.message ?? 'Something went wrong. Try again.',
      response.status,
      {
        ...(error?.field ? { field: error.field } : {}),
        meta: envelope.success ? envelope.data.meta : null,
      },
    )
  }
  if (!envelope.success) {
    throw new ApiRequestError('The server returned an unreadable response.', response.status)
  }

  const data = schema.safeParse(envelope.data.data)
  if (!data.success) {
    throw new ApiRequestError(
      `The server returned an unexpected shape: ${z.prettifyError(data.error)}`,
      response.status,
    )
  }

  return data.data
}

/** Empty in the browser; absolute on the server. */
function origin(): string {
  if (typeof window !== 'undefined') return ''
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}
