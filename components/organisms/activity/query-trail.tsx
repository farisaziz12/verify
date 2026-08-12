import type { Lookup, QueryOutcome } from '@/lib/dns/types'

/** Every DNS query this check ran. */
export function QueryTrail({ lookups }: { lookups: Lookup[] }) {
  return (
    <dl className="text-hint grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 font-mono sm:gap-x-4">
      <dt className="text-fg-subtle tracking-[0.3px]">query</dt>
      <dd className="text-fg-subtle text-right tracking-[0.3px]">latency</dd>

      {lookups.map((lookup) => (
        <div key={`${lookup.name}-${lookup.purpose}`} className="contents">
          <dt className="text-fg-muted break-all">
            TXT {lookup.name} → {summarise(lookup.outcome)}
          </dt>
          <dd className="text-fg-subtle text-right whitespace-nowrap">
            {lookup.outcome.kind === 'error' ? '—' : `${lookup.latencyMs} ms`}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function summarise(outcome: QueryOutcome): string {
  switch (outcome.kind) {
    case 'answered':
      return outcome.records.map((record) => `"${record.value}"`).join(', ')
    case 'nodata':
      return 'NOERROR, 0 answers'
    case 'nxdomain':
      return 'NXDOMAIN'
    case 'error':
      return outcome.reason
  }
}
