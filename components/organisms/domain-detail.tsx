'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { Card } from '@/components/atoms/card'
import { StatusIndicator } from '@/components/molecules/status-indicator'
import { ProviderSetup } from '@/components/organisms/provider-setup'
import { RecordCard } from '@/components/organisms/record-card'
import { domainQueryOptions } from '@/lib/query/queries/domains'

export function DomainDetail({ id }: { id: string }) {
  const { data, isPending, isError, error } = useQuery(domainQueryOptions(id))

  if (isPending) {
    return <Card className="px-4 py-7 text-fg-subtle text-ui">Loading domain…</Card>
  }
  if (isError) {
    return <Card className="px-4 py-7 text-danger text-ui">{error.message}</Card>
  }

  const { domain, record } = data

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-5">
        <Button asChild variant="link">
          <Link href="/">← Domains</Link>
        </Button>
        <div className="flex items-center justify-between gap-6">
          <h1 className="text-heading font-mono font-medium tracking-[-0.2px]">{domain.name}</h1>
          <StatusIndicator status={domain.status} />
        </div>
      </div>

      <RecordCard name={record.name} value={record.value} />
      <ProviderSetup recordName={record.name} />
    </div>
  )
}
