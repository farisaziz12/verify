import { classNames } from '@/lib/class-names'
import { type StatusTone, TONE } from '@/lib/tone'

export function StatusDot({ tone }: { tone: StatusTone }) {
  return (
    <span aria-hidden className={classNames('size-1.5 shrink-0 rounded-full', TONE[tone].bg)} />
  )
}
