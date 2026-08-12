import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { Card } from '@/components/atoms/card'

export function EmptyState() {
  return (
    <Card className="flex flex-col items-start gap-3.5 px-5 py-7">
      <p className="text-fg-muted text-body max-w-[62ch] text-pretty">
        A domain is verified by publishing one TXT record we give you. We keep checking while you're
        here, and tell you exactly what we find.
      </p>
      <Button asChild>
        <Link href="/domains/new">Add domain</Link>
      </Button>
    </Card>
  )
}
