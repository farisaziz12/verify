'use client'

import { Button } from '@/components/atoms/button'
import { Card } from '@/components/atoms/card'

export default function RouteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Card className="flex flex-col items-start gap-3.5 px-5 py-7">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-section font-medium">Something went wrong</h1>
        <p className="text-fg-muted text-body max-w-prose text-pretty">
          Nothing was lost. Your domains and their records are untouched — this screen failed to
          render, and trying again usually clears it.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </Card>
  )
}
