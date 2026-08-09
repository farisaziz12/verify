import type { Domain } from '@/lib/db/schema'

/**
 * Lifecycle questions, derived from `status` so there is nothing to keep in sync.
 *
 * `machine.ts` does not use these: it is what decides status, so it matches on the literals.
 */
type HasStatus = Pick<Domain, 'status'>

/** Proven. Nothing further is required of the user. */
export function isVerified({ status }: HasStatus): boolean {
  return status === 'verified'
}

/** Still being worked on — the only state anything re-checks on its own. */
export function isPending({ status }: HasStatus): boolean {
  return status === 'pending'
}

/** Nothing will change on its own again, whether it ended well or not. */
export function isSettled(domain: HasStatus): boolean {
  return !isPending(domain)
}
