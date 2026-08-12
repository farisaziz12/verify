import { Card } from '@/components/atoms/card'

export function RecordSummary({ name, value }: { name: string; value: string }) {
  return (
    <Card className="flex items-center justify-between gap-4 px-4 py-3">
      <p className="text-fg-muted text-ui truncate font-mono">
        TXT {name} · {value}
      </p>
      <p className="text-fg-subtle text-ui whitespace-nowrap">Record in place</p>
    </Card>
  )
}
