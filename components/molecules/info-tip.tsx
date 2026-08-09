'use client'

import { Tooltip } from 'radix-ui'

export function InfoTip({ label, children }: { label: string; children: string }) {
  return (
    <Tooltip.Provider delayDuration={120}>
      <Tooltip.Root>
        <Tooltip.Trigger
          aria-label={label}
          className="text-fg-faint hover:text-fg-bright focus-visible:text-fg-bright focus-visible:outline-fg grid size-[18px] cursor-pointer place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
            <title>Information</title>
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
            className="rounded-surface border-edge-tooltip bg-tooltip text-fg-muted text-hint z-30 w-[260px] border px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
          >
            {children}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
