import { Card } from '@/components/atoms/card'
import { CopyButton } from '@/components/atoms/copy-button'

// TYPE has no copy button, so its third cell is empty rather than absent — the grid tracks
// have to line up across all three rows.
const ROW = 'grid grid-cols-[92px_1fr_32px] items-center gap-4 px-4 py-3'
const LABEL = 'text-fg-subtle text-meta tracking-caps'
const VALUE = 'text-fg text-ui font-mono break-all'

export function RecordCard({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-section font-medium">DNS record</h2>
        <p className="text-fg-subtle text-ui">Add this at your DNS provider</p>
      </div>

      <Card>
        <div className={`${ROW} border-edge border-b`}>
          <div className={LABEL}>TYPE</div>
          <div className={VALUE}>TXT</div>
          <div />
        </div>
        <div className={`${ROW} border-edge border-b`}>
          <div className={LABEL}>NAME</div>
          <div className={VALUE}>{name}</div>
          <CopyButton value={name} label="Copy record name" />
        </div>
        <div className={ROW}>
          <div className={LABEL}>VALUE</div>
          <div className={VALUE}>{value}</div>
          <CopyButton value={value} label="Copy record value" />
        </div>
      </Card>
    </div>
  )
}
