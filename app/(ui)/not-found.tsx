import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { Card } from '@/components/atoms/card'

export default function NotFound() {
  return (
    <Card className="flex flex-col items-start gap-3.5 px-5 py-7">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-section font-medium">Not found</h1>
        <p className="text-fg-muted text-body max-w-[62ch] text-pretty">
          This page does not exist. If you followed a link to a domain, it may have been removed.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Back to domains</Link>
      </Button>
    </Card>
  )
}
