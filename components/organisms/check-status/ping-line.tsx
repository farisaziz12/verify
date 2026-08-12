'use client'

import { RelativeTime } from '@/components/molecules/relative-time'
import type { Domain } from '@/lib/db/schema'

/** Verified only: when we last confirmed the record. */
export function PingLine({ domain }: { domain: Domain }) {
  if (!domain.verifiedAt) return null

  return (
    <p className="text-fg-subtle text-hint font-mono">
      Last verified <RelativeTime value={domain.verifiedAt} />
    </p>
  )
}
