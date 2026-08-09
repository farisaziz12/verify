import { sql } from 'drizzle-orm'
import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'

export const domainStatus = pgEnum('domain_status', [
  'pending',
  'verified',
  'expired',
  'temporarily_failed',
  'revoked',
])

/** A claimed domain and its verification lifecycle state (SPEC §8). */
export const domains = pgTable(
  'domains',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text('name').notNull().unique(),
    token: text('token').notNull(),
    status: domainStatus('status').notNull().default('pending'),
    consecutiveFailures: integer('consecutive_failures').notNull().default(0),
    nextCheckAt: timestamp('next_check_at', { withTimezone: true }).notNull(),
    claimedAt: timestamp('claimed_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    failingSince: timestamp('failing_since', { withTimezone: true }),
    lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  },
  (table) => [
    index('domains_next_check_at_idx')
      .on(table.nextCheckAt)
      .where(sql`${table.status} in ('pending', 'verified', 'temporarily_failed')`),
  ],
)
