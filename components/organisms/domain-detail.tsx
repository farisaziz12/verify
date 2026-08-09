'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { Card } from '@/components/atoms/card'
import { ProgressSteps } from '@/components/molecules/progress-steps'
import { StatusIndicator } from '@/components/molecules/status-indicator'
import { Activity } from '@/components/organisms/activity'
import { CheckStatus } from '@/components/organisms/check-status'
import { ProviderSetup } from '@/components/organisms/provider-setup'
import { RecordCard } from '@/components/organisms/record-card'
import { RecordSummary } from '@/components/organisms/record-summary'
import { isVerified } from '@/lib/domain/status'
import { domainQueryOptions } from '@/lib/query/queries/domains'
import { describeDomain, stageFor } from '@/lib/verification/codes'

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

      <ProgressSteps stage={stageFor(diagnosisCode)} tone={description.tone} />

      <CheckStatus domain={domain} latestCheck={latestCheck} />

      {/* Once verified there is nothing left to publish, so the instructions collapse to a
          single line confirming what is in place. */}
      {isVerified(domain) ? (
        <RecordSummary name={record.name} value={record.value} />
      ) : (
        <>
          <RecordCard name={record.name} value={record.value} />
          <ProviderSetup recordName={record.name} />
        </>
      )}

      <Activity domainId={id} />
    </div>
  )
}
