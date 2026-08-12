import { StatusDot } from '@/components/atoms/status-dot'
import { classNames } from '@/lib/class-names'
import { type StatusTone, TONE } from '@/lib/tone'

export function StatusIndicator({ word, tone }: { word: string; tone: StatusTone }) {
  return (
    <span className={classNames('text-ui inline-flex items-center gap-2', TONE[tone].text)}>
      <StatusDot tone={tone} />
      {word}
    </span>
  )
}
