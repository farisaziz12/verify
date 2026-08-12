// Durations and the arithmetic on them. Every constant is milliseconds.

export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

/** Signed seconds between now and `at`, rounded. Positive is in the future. */
export function secondsFromNow(at: Date, now: number = Date.now()): number {
  return Math.round((at.getTime() - now) / SECOND)
}

/** Whole seconds until `at`, floored at zero — a countdown never runs negative. */
export function secondsUntil(at: Date, now: number = Date.now()): number {
  return Math.max(0, secondsFromNow(at, now))
}

/** `45s` below a minute, then `m:ss`. */
export function formatCountdown(seconds: number): string {
  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

/** `just now` under ten seconds, then `45s ago`, `5m ago`, `3h ago`, `2d ago`, `in 5m`. */
export function formatRelative(at: Date, now: number = Date.now()): string {
  const deltaMs = at.getTime() - now
  const magnitude = Math.abs(deltaMs)

  if (magnitude < 10 * SECOND) return 'just now'

  const amount =
    magnitude < MINUTE
      ? `${Math.round(magnitude / SECOND)}s`
      : magnitude < HOUR
        ? `${Math.floor(magnitude / MINUTE)}m`
        : magnitude < DAY
          ? `${Math.floor(magnitude / HOUR)}h`
          : `${Math.floor(magnitude / DAY)}d`

  return deltaMs > 0 ? `in ${amount}` : `${amount} ago`
}

/** Wall-clock time in the reader's own timezone, 24-hour. */
export function formatClockTime(at: Date): string {
  return at.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

/**
 * A duration in the largest unit that keeps the number small: `45 minutes`, `2 hours`, `1 day`.
 *
 * For copy a person reads once, where `1440 minutes` is arithmetic rather than an answer.
 */
export function formatCoarseDuration(ms: number): string {
  const [amount, unit] =
    ms < 90 * MINUTE
      ? [Math.ceil(ms / MINUTE), 'minute']
      : ms < 36 * HOUR
        ? [Math.round(ms / HOUR), 'hour']
        : [Math.round(ms / DAY), 'day']

  return `${amount} ${unit}${amount === 1 ? '' : 's'}`
}
