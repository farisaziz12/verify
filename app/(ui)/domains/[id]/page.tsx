import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { DomainDetail } from '@/components/organisms/domain-detail'
import { getQueryClient } from '@/lib/query/client'
import { checksQueryOptions } from '@/lib/query/queries/checks'
import { domainQueryOptions } from '@/lib/query/queries/domains'

export const dynamic = 'force-dynamic'

export default async function DomainDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const queryClient = getQueryClient()
  await Promise.all([
    queryClient.prefetchQuery(domainQueryOptions(id)),
    queryClient.prefetchQuery(checksQueryOptions(id)),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DomainDetail id={id} />
    </HydrationBoundary>
  )
}
