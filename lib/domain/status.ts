import type { DomainStatus } from '@/lib/db/schema'

export type StatusTone = 'verified' | 'attention' | 'pending' | 'inactive'

export interface StatusPresentation {
  word: string
  tone: StatusTone
}

/** How each lifecycle state reads to a user. */
export const STATUS_PRESENTATION = {
  pending: { word: 'Pending', tone: 'pending' },
  verified: { word: 'Verified', tone: 'verified' },
  expired: { word: 'Expired', tone: 'inactive' },
  temporarily_failed: { word: 'Record missing', tone: 'attention' },
  revoked: { word: 'Revoked', tone: 'inactive' },
} as const satisfies Record<DomainStatus, StatusPresentation>
