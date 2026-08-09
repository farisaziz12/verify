import { NextResponse } from 'next/server'

/** Every route returns this shape, success or failure. */
export interface Envelope<T> {
  data: T | null
  error: ApiError | null
  meta: Record<string, unknown> | null
}

export interface ApiError {
  message: string
  /** The request field at fault, when one can be named. */
  field?: string
}

/**
 * A successful response.
 *
 * @param data     The payload. `error` is always null beside it.
 * @param init.status  HTTP status; defaults to 200. Use 201 when a row was created.
 * @param init.meta    Out-of-band detail the client may act on, such as pagination.
 */
export function ok<T>(data: T, init?: { status?: number; meta?: Record<string, unknown> }) {
  return NextResponse.json<Envelope<T>>(
    { data, error: null, meta: init?.meta ?? null },
    { status: init?.status ?? 200 },
  )
}

/**
 * A failed response. `data` is always null beside the error.
 *
 * @param status   HTTP status.
 * @param message  Shown to the user as-is, so write it for them rather than for a log.
 * @param options.field  The request field at fault, when one can be named — the form uses it
 *                       to attach the message to the right input.
 * @param options.meta   Machine-readable detail the client needs to react correctly, such as
 *                       `retryAfterSeconds` on a 429.
 */
export function fail(
  status: number,
  message: string,
  options?: { field?: string; meta?: Record<string, unknown> },
) {
  const error: ApiError = options?.field ? { message, field: options.field } : { message }

  return NextResponse.json<Envelope<never>>(
    { data: null, error, meta: options?.meta ?? null },
    { status },
  )
}
