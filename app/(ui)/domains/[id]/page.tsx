import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DomainDetail } from '@/components/organisms/domain-detail'
import { getDomain, latestCheck, listChecks, TIMELINE_LENGTH } from '@/lib/db/queries'
import { getQueryClient } from '@/lib/query/client'
import { queryKeys } from '@/lib/query/keys'
import { recordName, recordValue } from '@/lib/verification/token'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const domain = await getDomain((await params).id)
  return { title: domain ? `${domain.name} · Verify` : 'Not found · Verify' }
}

/** Seeds the cache from the tables directly, rather than fetching this app's own API. */
export default async function DomainDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const domain = await getDomain(id)
  if (!domain) notFound()

  const [check, checks] = await Promise.all([latestCheck(id), listChecks(id, TIMELINE_LENGTH)])

  const queryClient = getQueryClient()
  queryClient.setQueryData(queryKeys.domains.detail(id), {
    domain,
    record: { name: recordName(domain.name), value: recordValue(domain.token) },
    latestCheck: check,
  })
  queryClient.setQueryData(queryKeys.domains.checks(id), checks)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DomainDetail id={id} />
    </HydrationBoundary>
  )
}
