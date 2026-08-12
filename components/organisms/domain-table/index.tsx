import { Card } from '@/components/atoms/card'
import { ErrorBoundary } from '@/components/molecules/error-boundary'
import { InfoTip } from '@/components/molecules/info-tip'
import { COLUMNS, ROW } from '@/components/organisms/domain-table/columns'
import { DomainRow } from '@/components/organisms/domain-table/domain-row'
import type { DomainListRow } from '@/lib/db/queries'

export function DomainTable({ rows }: { rows: DomainListRow[] }) {
  return (
    <Card>
      <div
        className={`${COLUMNS} border-edge text-fg-subtle text-meta tracking-caps border-b px-4 py-2.5`}
      >
        <div>DOMAIN</div>
        <div>STATUS</div>
        <div className="hidden text-right sm:block">LAST CHECKED</div>
      </div>

      {rows.map(({ domain, latestDiagnosis }) => (
        <ErrorBoundary
          key={domain.id}
          label="This domain"
          fallback={
            <div className={`${ROW} text-fg-subtle`}>
              <span className="text-ui font-mono">{domain.name}</span>
              <span className="text-ui">Could not be shown</span>
            </div>
          }
        >
          <DomainRow domain={domain} latestDiagnosis={latestDiagnosis} />
        </ErrorBoundary>
      ))}

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
