import Link from 'next/link'
import { RelativeTime } from '@/components/molecules/relative-time'
import { StatusIndicator } from '@/components/molecules/status-indicator'
import { ROW } from '@/components/organisms/domain-table/columns'
import type { DomainListRow } from '@/lib/db/queries'
import { describeDomain } from '@/lib/verification/codes'

/** One domain, linking to its detail screen. The whole row is the link target. */
export function DomainRow({ domain, latestDiagnosis }: DomainListRow) {
  const { word, tone } = describeDomain(domain.status, latestDiagnosis)

  return (
    <Link
      href={`/domains/${domain.id}`}
      className={`${ROW} hover:bg-control focus-visible:outline-fg transition-colors focus-visible:-outline-offset-2 focus-visible:outline-2`}
    >
      <span className="text-fg text-ui font-mono">{domain.name}</span>
      <StatusIndicator word={word} tone={tone} />
      <span className="text-fg-subtle text-hint hidden text-right font-mono sm:block">
        <RelativeTime value={domain.lastCheckedAt} />
      </span>
    </Link>
  )
}
