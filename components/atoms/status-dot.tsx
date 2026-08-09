import { classNames } from '@/lib/class-names'
import type { StatusTone } from '@/lib/domain/status'

const TONE = {
  verified: 'bg-status-verified',
  attention: 'bg-status-attention',
  pending: 'bg-status-pending',
  inactive: 'bg-status-inactive',
} satisfies Record<StatusTone, string>

export function StatusDot({ tone }: { tone: StatusTone }) {
  return <span aria-hidden className={classNames('size-[5px] shrink-0 rounded-full', TONE[tone])} />
}
