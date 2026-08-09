import { and, count, desc, eq, gte, lte, min } from 'drizzle-orm'
import type { DiagnosisCode } from '../verification/codes'
import type { CheckOutcome } from '../verification/engine'
import { mintToken } from '../verification/token'
import { getDb } from './client'
import { type Check, checks, type Domain, domains } from './schema'

export interface DomainListRow {
  domain: Domain
  /** From the most recent check; null when never checked. */
  latestDiagnosis: DiagnosisCode | null
}

/** Every domain with its latest diagnosis, newest claim first. One query, not one per row. */
export async function listDomains(): Promise<DomainListRow[]> {
  const db = getDb()

  const latest = db
    .selectDistinctOn([checks.domainId], {
      domainId: checks.domainId,
      diagnosisCode: checks.diagnosisCode,
    })
    .from(checks)
    .orderBy(checks.domainId, desc(checks.startedAt))
    .as('latest')

  const rows = await db
    .select({ domain: domains, latestDiagnosis: latest.diagnosisCode })
    .from(domains)
    .leftJoin(latest, eq(latest.domainId, domains.id))
    .orderBy(desc(domains.claimedAt))

  return rows
}

export async function getDomain(id: string): Promise<Domain | null> {
  const [domain] = await getDb().select().from(domains).where(eq(domains.id, id)).limit(1)
  return domain ?? null
}

/** Null when the name is already claimed. */
export async function createDomain(name: string): Promise<Domain | null> {
  const now = new Date()
  const [created] = await getDb()
    .insert(domains)
    .values({
      name,
      token: mintToken(),
      nextCheckAt: now,
      claimedAt: now,
    })
    .onConflictDoNothing({ target: domains.name })
    .returning()

  return created ?? null
}

export async function latestCheck(domainId: string): Promise<Check | null> {
  const [check] = await getDb()
    .select()
    .from(checks)
    .where(eq(checks.domainId, domainId))
    .orderBy(desc(checks.startedAt))
    .limit(1)
  return check ?? null
}

/**
 * Null when the domain was not due, or when another request already holds the lease.
 *
 * Claiming sets `next_check_at` to `leaseUntil`; the caller must overwrite it with a real
 * next time. Test and set happen in one statement, so two racing callers cannot both win.
 */
export async function claimDueCheck(id: string, leaseUntil: Date): Promise<Domain | null> {
  const [claimed] = await getDb()
    .update(domains)
    .set({ nextCheckAt: leaseUntil })
    .where(and(eq(domains.id, id), lte(domains.nextCheckAt, new Date())))
    .returning()

  return claimed ?? null
}

/** Newest first. Each row carries its whole `lookups` trail, so `limit` is required. */
export function listChecks(domainId: string, limit: number): Promise<Check[]> {
  return getDb()
    .select()
    .from(checks)
    .where(eq(checks.domainId, domainId))
    .orderBy(desc(checks.startedAt))
    .limit(limit)
}

/** Counts `trigger = 'manual'` only. `oldestAt` is null when the count is zero. */
export async function countManualChecksSince(
  domainId: string,
  since: Date,
): Promise<{ total: number; oldestAt: Date | null }> {
  const [row] = await getDb()
    .select({ total: count(), oldestAt: min(checks.startedAt) })
    .from(checks)
    .where(
      and(
        eq(checks.domainId, domainId),
        eq(checks.trigger, 'manual'),
        gte(checks.startedAt, since),
      ),
    )

  return { total: row?.total ?? 0, oldestAt: row?.oldestAt ?? null }
}

/**
 * Writes the check row and the status change it implies as one server-side transaction.
 *
 * The only writer of `domains.status`.
 */
export async function recordCheck(outcome: CheckOutcome): Promise<Check> {
  const { check, transition } = outcome
  const { nextCheckAt, verifiedAt } = transition.changes
  const db = getDb()

  const [inserted] = await db.batch([
    db.insert(checks).values(check).returning(),
    db
      .update(domains)
      .set({
        status: transition.to,
        nextCheckAt,
        lastCheckedAt: check.finishedAt,
        ...(verifiedAt ? { verifiedAt } : {}),
      })
      .where(eq(domains.id, check.domainId)),
  ])

  const row = inserted[0]
  if (!row) throw new Error('check insert returned no row')
  return row
}
