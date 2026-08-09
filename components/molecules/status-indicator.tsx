import { StatusDot } from '@/components/atoms/status-dot'
import { classNames } from '@/lib/class-names'
import { type StatusTone, TONE } from '@/lib/tone'

/**
 * A dot and a word in the same colour — deliberately not a pill.
 *
 * Takes what to say rather than working it out, so the list row and the detail header cannot
 * end up describing the same domain differently.
 */
export function StatusIndicator({ word, tone }: { word: string; tone: StatusTone }) {
  return (
    <span className={classNames('text-ui inline-flex items-center gap-2', TONE[tone].text)}>
      <StatusDot tone={tone} />
      {word}
    </span>
  )
}
