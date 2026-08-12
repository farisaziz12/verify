'use client'

import { useQuery } from '@tanstack/react-query'
import { Accordion } from 'radix-ui'
import { Card } from '@/components/atoms/card'
import { ActivityRow } from '@/components/organisms/activity/activity-row'
import { checksQueryOptions } from '@/lib/query/queries/checks'

/** The most recent checks, newest first, each opening onto the queries behind it. */
export function Activity({ domainId }: { domainId: string }) {
  const { data: checks, isPending, isError } = useQuery(checksQueryOptions(domainId))

  // Nothing to show before the first check, and nothing worth a heading while loading.
  if (isPending || (!isError && checks.length === 0)) return null

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-section font-medium">Activity</h2>
        {/* "Last n" rather than a total: the API returns only the most recent few, so a bare
            count would read as the number of checks ever run. */}
        {!isError && (
          <p className="text-fg-subtle text-ui">
            Last {checks.length} {checks.length === 1 ? 'check' : 'checks'}
          </p>
        )}
      </div>

      {isError ? (
        <Card className="text-fg-subtle text-ui px-4 py-5">
          We couldn't load the check history. This says nothing about your record — the status above
          is still accurate.
        </Card>
      ) : (
        <Card>
          <Accordion.Root type="single" collapsible>
            {checks.map((check) => (
              <ActivityRow key={check.id} check={check} />
            ))}
          </Accordion.Root>
        </Card>
      )}
    </section>
  )
}
