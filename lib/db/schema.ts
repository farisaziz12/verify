import { sql } from 'drizzle-orm'
import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import type { Lookup } from '../dns/types'
import type { DiagnosisCode } from '../verification/codes'
import type { DiagnosisEvidence } from '../verification/diagnose'

/**
 * `expired`, `temporarily_failed`, and `revoked` are reserved enum values.
 * The lifecycle machine only writes `pending` and `verified`; see docs/DECISIONS.md.
 */
export const domainStatus = pgEnum('domain_status', [
  'pending',
  'verified',
  'expired',
  'temporarily_failed',
  'revoked',
])

export const domains = pgTable(
  'domains',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text('name').notNull().unique(),
    token: text('token').notNull(),
    status: domainStatus('status').notNull().default('pending'),
    nextCheckAt: timestamp('next_check_at', { withTimezone: true }).notNull(),
    claimedAt: timestamp('claimed_at', { withTimezone: true }).notNull().defaultNow(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  },
  (table) => [
    index('domains_next_check_at_idx')
      .on(table.nextCheckAt)
      .where(sql`${table.status} in ('pending', 'verified')`),
  ],
)

export const checkTrigger = pgEnum('check_trigger', ['manual', 'sweep'])

export const checkVerdict = pgEnum('check_verdict', ['pass', 'fail', 'indeterminate'])

export const checks = pgTable(
  'checks',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    domainId: uuid('domain_id')
      .notNull()
      .references(() => domains.id, { onDelete: 'cascade' }),
    trigger: checkTrigger('trigger').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }).notNull(),
    /** In the order walked. */
    lookups: jsonb('lookups').$type<Lookup[]>().notNull(),
    verdict: checkVerdict('verdict').notNull(),
    diagnosisCode: text('diagnosis_code').$type<DiagnosisCode>().notNull(),
    evidence: jsonb('evidence').$type<DiagnosisEvidence>(),
    /** Advisory only. */
    notes: jsonb('notes').$type<string[]>(),
  },
  (table) => [index('checks_domain_id_started_at_idx').on(table.domainId, table.startedAt.desc())],
)

export type Domain = typeof domains.$inferSelect
export type Check = typeof checks.$inferSelect

export type DomainStatus = (typeof domainStatus.enumValues)[number]
