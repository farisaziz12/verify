import { StatusDot } from '@/components/atoms/status-dot'
import { cn } from '@/lib/cn'
import type { DomainStatus } from '@/lib/db/schema'
import { STATUS_PRESENTATION, type StatusTone } from '@/lib/domain/status'

const TONE_TEXT = {
  verified: 'text-status-verified',
  attention: 'text-status-attention',
  pending: 'text-status-pending',
  inactive: 'text-status-inactive',
} satisfies Record<StatusTone, string>

/** A dot and a word in the same colour. */
export function StatusIndicator({ status }: { status: DomainStatus }) {
  const { word, tone } = STATUS_PRESENTATION[status]
  return (
    <span className={cn('text-ui inline-flex items-center gap-2', TONE_TEXT[tone])}>
      <StatusDot tone={tone} />
      {word}
    </span>
  )
}
