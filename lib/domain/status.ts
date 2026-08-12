import type { Domain } from '@/lib/db/schema'

type HasStatus = Pick<Domain, 'status'>

export function isVerified({ status }: HasStatus): boolean {
  return status === 'verified'
}

/** The only status anything re-checks on its own. */
export function isPending({ status }: HasStatus): boolean {
  return status === 'pending'
}

export function isSettled(domain: HasStatus): boolean {
  return !isPending(domain)
}
