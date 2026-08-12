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

export function ok<T>(data: T, init?: { status?: number; meta?: Record<string, unknown> }) {
  return NextResponse.json<Envelope<T>>(
    { data, error: null, meta: init?.meta ?? null },
    { status: init?.status ?? 200 },
  )
}

/** `message` is shown to the user as-is. */
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
