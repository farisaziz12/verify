import type { Check, Domain } from '@/lib/db/schema'
import type { Lookup, QueryOutcome, Resolver } from '@/lib/dns/types'
import { diagnose } from './diagnose'
import { type Transition, transition } from './machine'
import { recordName, recordValue } from './token'

export type CheckTrigger = 'manual' | 'sweep'

export interface CheckOutcome {
  check: Omit<Check, 'id'>
  transition: Transition
}

export interface RunCheckDeps {
  resolver: Resolver
  now?: () => Date
}

/** Writes nothing: the caller must persist `check` and `transition` together. */
export async function runCheck(
  domain: Domain,
  trigger: CheckTrigger,
  deps: RunCheckDeps,
): Promise<CheckOutcome> {
  const now = deps.now?.() ?? new Date()
  const expectedValue = recordValue(domain.token)
  const lookups: Lookup[] = []

  const expectedName = recordName(domain.name)
  const probeName = `${expectedName}.${domain.name}`

  const primary = await query(deps.resolver, expectedName, 'the record you published', lookups)

  const probe = matches(primary, expectedValue)
    ? null
    : await query(deps.resolver, probeName, 'probing for a provider-appended zone name', lookups)

  const diagnosis = diagnose({
    primary,
    probe,
    expectedValue,
    expectedName,
    probeName,
    claimAgeMs: now.getTime() - domain.claimedAt.getTime(),
  })

  return {
    check: {
      domainId: domain.id,
      trigger,
      startedAt: now,
      finishedAt: new Date(now.getTime() + totalLatency(lookups)),
      lookups,
      verdict: diagnosis.verdict,
      diagnosisCode: diagnosis.code,
      evidence: diagnosis.evidence ?? null,
      notes: diagnosis.notes ?? null,
    },
    transition: transition(domain, diagnosis.verdict, now),
  }
}

/** Appends to `trail` whatever the outcome. */
async function query(
  resolver: Resolver,
  name: string,
  purpose: string,
  trail: Lookup[],
): Promise<QueryOutcome> {
  const startedAt = Date.now()
  const { outcome, resolver: answeredBy } = await resolver.query(name, 'TXT')
  trail.push({ name, purpose, resolver: answeredBy, outcome, latencyMs: Date.now() - startedAt })
  return outcome
}

function matches(outcome: QueryOutcome, value: string): boolean {
  return outcome.kind === 'answered' && outcome.records.some((record) => record.value === value)
}

function totalLatency(lookups: Lookup[]): number {
  return lookups.reduce((sum, lookup) => sum + lookup.latencyMs, 0)
}
