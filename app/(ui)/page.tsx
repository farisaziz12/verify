import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { DomainList } from '@/components/organisms/domain-list'
import { getQueryClient } from '@/lib/query/client'
import { domainsQueryOptions } from '@/lib/query/queries/domains'

export const dynamic = 'force-dynamic'

export default async function DomainsPage() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(domainsQueryOptions())

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
