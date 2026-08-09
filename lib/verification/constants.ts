/** The sentinel `next_check_at` for a domain that must never become due again. */
export const FAR_FUTURE = new Date('9999-01-01T00:00:00Z')

/** How long an unverified claim survives before expiring, in milliseconds (72 hours). */
export const CLAIM_TTL_MS = 72 * 60 * 60 * 1000
