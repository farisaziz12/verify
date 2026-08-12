'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { Card } from '@/components/atoms/card'
import { ErrorBoundary } from '@/components/molecules/error-boundary'
import { ProgressSteps } from '@/components/molecules/progress-steps'
import { StatusIndicator } from '@/components/molecules/status-indicator'
import { Activity } from '@/components/organisms/activity'
import { CheckStatus } from '@/components/organisms/check-status'
import { ProviderSetup } from '@/components/organisms/provider-setup'
import { RecordCard } from '@/components/organisms/record-card'
import { RecordSummary } from '@/components/organisms/record-summary'
import { RemoveDomain } from '@/components/organisms/remove-domain'
import { isVerified } from '@/lib/domain/status'
import { domainQueryOptions } from '@/lib/query/queries/domains'
import { describeDomain, hasStaleRecord, stageFor } from '@/lib/verification/codes'

export function DomainDetail({ id }: { id: string }) {
  const { data, isPending, isError, error } = useQuery(domainQueryOptions(id))

  if (isPending) {
    return <Card className="text-fg-subtle text-ui px-4 py-7">Loading domain…</Card>
  }
  if (isError) {
    return <Card className="text-danger text-ui px-4 py-7">{error.message}</Card>
  }

  const { domain, record, latestCheck } = data
  const { diagnosisCode = null } = latestCheck ?? {}
  const description = describeDomain(domain.status, diagnosisCode)
  const isStale = hasStaleRecord(domain.status, diagnosisCode)

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-5">
        <Button asChild variant="link">
          <Link href="/">← Domains</Link>
        </Button>
        <div className="flex items-center justify-between gap-6">
          <h1 className="text-heading font-mono font-medium tracking-[-0.2px]">{domain.name}</h1>
          <StatusIndicator {...description} />
        </div>
      </div>

      <ProgressSteps stage={stageFor(domain.status, diagnosisCode)} tone={description.tone} />

      <ErrorBoundary label="This domain's status">
        <CheckStatus domain={domain} latestCheck={latestCheck} />
      </ErrorBoundary>

      <ErrorBoundary label="The record to publish">
        {isVerified(domain) && !isStale ? (
          <RecordSummary name={record.name} value={record.value} />
        ) : (
          <>
            <RecordCard name={record.name} value={record.value} />
            <ProviderSetup recordName={record.name} />
          </>
        )}
      </ErrorBoundary>

      <ErrorBoundary label="The check history">
        <Activity domainId={id} />
      </ErrorBoundary>

      <div className="flex items-center">
        <RemoveDomain domain={domain} />
      </div>
    </div>
  )
}
