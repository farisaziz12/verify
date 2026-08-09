import Link from 'next/link'
import { Card } from '@/components/atoms/card'
import { InfoTip } from '@/components/molecules/info-tip'
import { RelativeTime } from '@/components/molecules/relative-time'
import { StatusIndicator } from '@/components/molecules/status-indicator'
import type { Domain } from '@/lib/db/schema'

const COLUMNS = 'grid grid-cols-[1fr_150px_110px] gap-4'

export function DomainTable({ domains }: { domains: Domain[] }) {
  return (
    <Card>
      <div
        className={`${COLUMNS} border-edge text-fg-subtle text-meta tracking-caps border-b px-4 py-2.5`}
      >
        <div>DOMAIN</div>
        <div>STATUS</div>
        <div className="text-right">LAST CHECKED</div>
      </div>

      {domains.map((domain) => (
        <Link
          key={domain.id}
          href={`/domains/${domain.id}`}
          className={`${COLUMNS} border-edge-subtle hover:bg-control focus-visible:outline-fg items-center border-b px-4 py-3.5 transition-colors focus-visible:-outline-offset-2 focus-visible:outline-2`}
        >
          <span className="text-fg text-ui font-mono">{domain.name}</span>
          <StatusIndicator status={domain.status} />
          <span className="text-fg-subtle text-hint text-right font-mono">
            <RelativeTime value={domain.lastCheckedAt} />
          </span>
        </Link>
      ))}

      <div className="text-fg-subtle text-ui flex items-center gap-2 px-4 py-3">
        <span>
          {domains.length} {domains.length === 1 ? 'domain' : 'domains'}
        </span>
        <InfoTip label="how often domains are checked">
          {'We keep checking while you’re here.'}
        </InfoTip>
      </div>
    </Card>
  )
}
