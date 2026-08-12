export type StatusTone = 'verified' | 'attention' | 'pending' | 'inactive'

export const TONE = {
  verified: { text: 'text-status-verified', bg: 'bg-status-verified' },
  attention: { text: 'text-status-attention', bg: 'bg-status-attention' },
  pending: { text: 'text-status-pending', bg: 'bg-status-pending' },
  inactive: { text: 'text-status-inactive', bg: 'bg-status-inactive' },
} satisfies Record<StatusTone, { text: string; bg: string }>
