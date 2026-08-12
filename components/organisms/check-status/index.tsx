'use client'

import { Card } from '@/components/atoms/card'
import { StatusDot } from '@/components/atoms/status-dot'
import { VerifiedBadge } from '@/components/atoms/verified-badge'
import { Evidence } from '@/components/molecules/evidence'
import { InfoTip } from '@/components/molecules/info-tip'
import { CheckButton } from '@/components/organisms/check-status/check-button'
import { PingLine } from '@/components/organisms/check-status/ping-line'
import { WatchIndicator } from '@/components/organisms/check-status/watch-indicator'
import { classNames } from '@/lib/class-names'
import type { Check, Domain } from '@/lib/db/schema'
import { useRunCheck } from '@/lib/query/mutations/use-run-check'
import { useAutoCheck } from '@/lib/query/queries/use-auto-check'
import { describeCheckStatus } from '@/lib/verification/codes'
import { isComparison } from '@/lib/verification/diagnose'

interface CheckStatusProps {
  domain: Domain
  latestCheck: Check | null
}

export function CheckStatus({ domain, latestCheck }: CheckStatusProps) {
  const runCheck = useRunCheck(domain.id)
  const auto = useAutoCheck(domain)
  const { diagnosisCode = null, evidence = null, notes } = latestCheck ?? {}
  const view = describeCheckStatus(domain.status, diagnosisCode)

  return (
    <Card
      className={classNames(
        'flex flex-col gap-2 px-4 py-3.5',
        view.showsVerified && 'border-edge-verified',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        {view.showsVerified ? <VerifiedBadge /> : <StatusDot tone={view.tone} />}

        <span aria-live="polite" className="text-body font-medium">
          {view.headline}
        </span>

        {view.summary && (
          <InfoTip label="what this status means" shrink>
            {view.summary}
          </InfoTip>
        )}

        <span className="flex-1" />

        <WatchIndicator
          isWatching={auto.isWatching}
          isChecking={auto.isChecking || runCheck.isPending}
          nextAskAt={auto.nextAskAt}
        />

        <CheckButton
          onCheck={() => runCheck.mutate()}
          isPending={runCheck.isPending}
          retryAfterSeconds={runCheck.retryAfterSeconds}
        />
      </div>

      {view.showsVerified && <PingLine domain={domain} />}

      {isComparison(evidence) && <Evidence expected={evidence.expected} found={evidence.found} />}

      {view.action && <p className="text-fg text-ui max-w-[64ch] text-pretty">{view.action}</p>}

      {notes?.map((note) => (
        <p key={note} className="text-fg-subtle text-hint max-w-[64ch] text-pretty">
          {note}
        </p>
      ))}

      {runCheck.isError && <p className="text-danger text-hint">{runCheck.error.message}</p>}
    </Card>
  )
}
