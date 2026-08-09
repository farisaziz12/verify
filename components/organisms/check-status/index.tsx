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
import { isVerified } from '@/lib/domain/status'
import { useRunCheck } from '@/lib/query/mutations/use-run-check'
import { useAutoCheck } from '@/lib/query/queries/use-auto-check'
import { DIAGNOSES } from '@/lib/verification/codes'
import { isComparison } from '@/lib/verification/diagnose'

interface CheckStatusProps {
  domain: Domain
  latestCheck: Check | null
}

/** What the last check found, and the one action it implies. */
export function CheckStatus({ domain, latestCheck }: CheckStatusProps) {
  const runCheck = useRunCheck(domain.id)
  const auto = useAutoCheck(domain)
  const { diagnosisCode, evidence = null, notes } = latestCheck ?? {}
  const diagnosis = diagnosisCode ? DIAGNOSES[diagnosisCode] : null

  return (
    <Card
      className={classNames(
        'flex flex-col gap-2 px-4 py-3.5',
        isVerified(domain) && 'border-edge-verified',
      )}
    >
      <div className="flex items-center gap-2.5">
        {isVerified(domain) ? (
          <VerifiedBadge />
        ) : (
          <StatusDot tone={diagnosis?.tone ?? 'inactive'} />
        )}

        <span aria-live="polite" className="text-body font-medium">
          {diagnosis?.headline ?? 'Not checked yet'}
        </span>

        {diagnosis && (
          <InfoTip label="what this status means" shrink>
            {diagnosis.summary}
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

      {isVerified(domain) && <PingLine domain={domain} />}

      {isComparison(evidence) && <Evidence expected={evidence.expected} found={evidence.found} />}

      {diagnosis?.action && (
        <p className="text-fg text-ui max-w-[64ch] text-pretty">{diagnosis.action}</p>
      )}

      {notes?.map((note) => (
        <p key={note} className="text-fg-subtle text-hint max-w-[64ch] text-pretty">
          {note}
        </p>
      ))}

      {runCheck.isError && <p className="text-danger text-hint">{runCheck.error.message}</p>}
    </Card>
  )
}
