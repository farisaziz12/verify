// Every constant is milliseconds.

export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

/** Rounded. Positive is in the future. */
export function secondsFromNow(at: Date, now: number = Date.now()): number {
  return Math.round((at.getTime() - now) / SECOND)
}

/** Whole seconds, floored at zero. */
export function secondsUntil(at: Date, now: number = Date.now()): number {
  return Math.max(0, secondsFromNow(at, now))
}

/** `45s` below a minute, then `m:ss`. */
export function formatCountdown(seconds: number): string {
  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

/** `just now`, `45s ago`, `3h ago`, `in 5m`. */
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

/** The reader's own timezone, 24-hour. */
export function formatClockTime(at: Date): string {
  return at.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

/** Takes milliseconds; renders the largest unit that keeps the number small: `2 hours`, `1 day`. */
export function formatCoarseDuration(ms: number): string {
  const [amount, unit] =
    ms < 90 * MINUTE
      ? [Math.ceil(ms / MINUTE), 'minute']
      : ms < 36 * HOUR
        ? [Math.round(ms / HOUR), 'hour']
        : [Math.round(ms / DAY), 'day']

  return `${amount} ${unit}${amount === 1 ? '' : 's'}`
}
