import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { DomainList } from '@/components/organisms/domain-list'
import { listDomains } from '@/lib/db/queries'
import { getQueryClient } from '@/lib/query/client'
import { queryKeys } from '@/lib/query/keys'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Domains · Verify' }

export default async function DomainsPage() {
  const queryClient = getQueryClient()
  queryClient.setQueryData(queryKeys.domains.list(), await listDomains())

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-6">
        <h1 className="text-heading font-medium">Domains</h1>
        <Button asChild>
          <Link href="/domains/new">Add domain</Link>
        </Button>
      </div>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <DomainList />
      </HydrationBoundary>
    </div>
  )
}
