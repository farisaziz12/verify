'use client'

import { useQuery } from '@tanstack/react-query'
import { ListMessage } from '@/components/molecules/list-message'
import { DomainTable } from '@/components/organisms/domain-table'
import { EmptyState } from '@/components/organisms/empty-state'
import { domainsQueryOptions } from '@/lib/query/queries/domains'

export function DomainList() {
  const { data, isPending, isError, error } = useQuery(domainsQueryOptions())

  if (isPending) return <ListMessage>Loading domains…</ListMessage>
  if (isError) return <ListMessage tone="danger">{error.message}</ListMessage>
  if (data.length === 0) return <EmptyState />

  return <DomainTable rows={data} />
}
