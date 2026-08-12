'use client'

import { Accordion } from 'radix-ui'
import { StatusDot } from '@/components/atoms/status-dot'
import { Evidence } from '@/components/molecules/evidence'
import { RelativeTime } from '@/components/molecules/relative-time'
import { Timestamp } from '@/components/molecules/timestamp'
import { QueryTrail } from '@/components/organisms/activity/query-trail'
import type { Check } from '@/lib/db/schema'
import { DIAGNOSES } from '@/lib/verification/codes'
import { isComparison } from '@/lib/verification/diagnose'

export function ActivityRow({ check }: { check: Check }) {
  const { logTitle, tone } = DIAGNOSES[check.diagnosisCode]
  const evidence = check.evidence

  return (
    <Accordion.Item value={check.id} className="border-edge-subtle border-b">
      <Accordion.Header>
        <Accordion.Trigger className="hover:bg-card focus-visible:outline-fg group grid w-full cursor-pointer grid-cols-[14px_1fr_auto] items-center gap-3 sm:grid-cols-[14px_96px_1fr_auto] bg-transparent px-4 py-2.5 text-left transition-colors focus-visible:-outline-offset-2 focus-visible:outline-2">
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            aria-hidden
            className="text-fg-subtle transition-transform duration-150 group-data-[state=open]:rotate-90"
          >
            <title>Toggle</title>
            <path
              d="M3.5 1.5 L7 5 L3.5 8.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <span className="text-fg-subtle text-hint hidden font-mono sm:block">
            <Timestamp value={check.startedAt} />
          </span>

          <span className="text-fg-bright text-ui inline-flex items-center gap-2">
            <StatusDot tone={tone} />
            {logTitle}
          </span>

          <span className="text-fg-subtle text-hint font-mono">
            <RelativeTime value={check.startedAt} />
          </span>
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Content className="overflow-hidden">
        <div className="flex flex-col gap-2.5 pt-0.5 pr-4 pb-3.5 pl-[42px]">
          {isComparison(evidence) && (
            <Evidence expected={evidence.expected} found={evidence.found} />
          )}
          <QueryTrail lookups={check.lookups} />
        </div>
      </Accordion.Content>
    </Accordion.Item>
  )
}
