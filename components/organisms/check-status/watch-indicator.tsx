import { Countdown } from '@/components/molecules/countdown'
import { classNames } from '@/lib/class-names'

interface WatchIndicatorProps {
  /** False once the domain has settled and nothing more will happen on its own. */
  isWatching: boolean
  /** True while a DNS query is actually in flight. */
  isChecking: boolean
  /** When the page will next ask, from `useAutoCheck`. Null until the first answer lands. */
  nextAskAt: Date | null
}

/** Whether a check is coming and when. Renders nothing once the domain has settled. */
export function WatchIndicator({ isWatching, isChecking, nextAskAt }: WatchIndicatorProps) {
  if (!isWatching) return null

  return (
    <span className="text-fg-subtle text-hint flex items-center gap-2.5 whitespace-nowrap">
      <span className="tabular-nums">
        {isChecking ? 'Checking' : <Countdown to={nextAskAt} whileUnknown="Watching" />}
      </span>
      <span className="bg-edge relative block h-px w-11 overflow-hidden">
        <span
          className={classNames(
            'absolute inset-0 bg-gradient-to-r from-transparent via-current to-transparent',
            isChecking
              ? 'text-fg animate-[scan_700ms_linear_infinite]'
              : 'text-status-pending animate-[scan_2.4s_ease-in-out_infinite]',
          )}
        />
      </span>
    </span>
  )
}
