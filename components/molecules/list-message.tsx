import { Card } from '@/components/atoms/card'

/** A one-line card standing in for the table while it loads or after it fails. */
export function ListMessage({ children, tone }: { children: string; tone?: 'danger' }) {
  return (
    <Card className="px-4 py-7">
      <p className={tone === 'danger' ? 'text-danger text-ui' : 'text-fg-subtle text-ui'}>
        {children}
      </p>
    </Card>
  )
}
