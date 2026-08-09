'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/atoms/card'
import { DomainTable } from '@/components/organisms/domain-table'
import { EmptyState } from '@/components/organisms/empty-state'
import { domainsQueryOptions } from '@/lib/query/queries/domains'

export function DomainList() {
  const { data, isPending, isError, error } = useQuery(domainsQueryOptions())

  if (isPending) return <ListMessage>Loading domains…</ListMessage>
  if (isError) return <ListMessage tone="danger">{error.message}</ListMessage>
  if (data.length === 0) return <EmptyState />

  return <DomainTable domains={data} />
}

function ListMessage({ children, tone }: { children: string; tone?: 'danger' }) {
  return (
    <Card className="px-4 py-7">
      <p className={tone === 'danger' ? 'text-danger text-ui' : 'text-fg-subtle text-ui'}>
        {children}
      </p>
    </Card>
  )
}
