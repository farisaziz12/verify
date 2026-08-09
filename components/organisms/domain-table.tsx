import Link from 'next/link'
import { Card } from '@/components/atoms/card'
import { InfoTip } from '@/components/molecules/info-tip'
import { RelativeTime } from '@/components/molecules/relative-time'
import { StatusIndicator } from '@/components/molecules/status-indicator'
import type { DomainListRow } from '@/lib/db/queries'
import { describeDomain } from '@/lib/verification/codes'

const COLUMNS = 'grid grid-cols-[1fr_150px_110px] gap-4'

export function DomainTable({ rows }: { rows: DomainListRow[] }) {
  return (
    <Card>
      <div
        className={`${COLUMNS} border-edge text-fg-subtle text-meta tracking-caps border-b px-4 py-2.5`}
      >
        <div>DOMAIN</div>
        <div>STATUS</div>
        <div className="text-right">LAST CHECKED</div>
      </div>

      {rows.map(({ domain, latestDiagnosis }) => {
        const { word, tone } = describeDomain(domain.status, latestDiagnosis)

        return (
          <Link
            key={domain.id}
            href={`/domains/${domain.id}`}
            className={`${COLUMNS} border-edge-subtle hover:bg-control focus-visible:outline-fg items-center border-b px-4 py-3.5 transition-colors focus-visible:-outline-offset-2 focus-visible:outline-2`}
          >
            <span className="text-fg text-ui font-mono">{domain.name}</span>
            <StatusIndicator word={word} tone={tone} />
            <span className="text-fg-subtle text-hint text-right font-mono">
              <RelativeTime value={domain.lastCheckedAt} />
            </span>
          </Link>
        )
      })}

      <div className="text-fg-subtle text-ui flex items-center gap-2 px-4 py-3">
        <span>
          {rows.length} {rows.length === 1 ? 'domain' : 'domains'}
        </span>
        <InfoTip label="how often domains are checked">
          {'A domain is checked when you open it and press Check now.'}
        </InfoTip>
      </div>
    </Card>
  )
}
