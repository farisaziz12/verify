'use client'

import { Tooltip } from 'radix-ui'
import { classNames } from '@/lib/class-names'

interface InfoTipProps {
  /** Announced to screen readers in place of the icon, e.g. "what this status means". */
  label: string
  /** Plain text. The tooltip is one paragraph — it holds no interactive content. */
  children: string
  /** Set when the tip sits in a flex row that would otherwise squash the icon. */
  shrink?: boolean
}

/** An explanatory sentence behind an info button, so the inline copy stays to the point. */
export function InfoTip({ label, children, shrink = false }: InfoTipProps) {
  return (
    <Tooltip.Provider delayDuration={120}>
      <Tooltip.Root>
        <Tooltip.Trigger
          aria-label={label}
          className={classNames(
            'text-fg-faint hover:text-fg-bright focus-visible:text-fg-bright focus-visible:outline-fg grid size-tip cursor-pointer place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
            shrink && 'shrink-0',
          )}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
            <title>{label}</title>
            <circle cx="7" cy="7" r="5.6" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7 6.4V9.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="7" cy="4.3" r="0.5" fill="currentColor" />
          </svg>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            align="start"
            sideOffset={6}
            className="rounded-surface border-edge-tooltip bg-tooltip text-fg-muted text-hint shadow-popover z-30 w-tooltip border px-3 py-2.5 text-pretty"
          >
            {children}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
