'use client'

import { Accordion } from 'radix-ui'
import type { ReactNode } from 'react'

interface DisclosureProps {
  /** Unique within its group; the group tracks which value is open. */
  value: string
  label: ReactNode
  children: ReactNode
}

export function Disclosure({ value, label, children }: DisclosureProps) {
  return (
    <Accordion.Item value={value} className="border-edge-subtle border-t">
      <Accordion.Header>
        <Accordion.Trigger className="text-fg-muted hover:text-fg text-ui focus-visible:outline-fg group flex w-full cursor-pointer items-center gap-2.5 bg-transparent px-0.5 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2">
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            aria-hidden
            className="shrink-0 transition-transform duration-150 group-data-[state=open]:rotate-90"
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
          <span>{label}</span>
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="overflow-hidden">
        <div className="text-fg-muted text-ui flex max-w-[62ch] flex-col gap-2 pt-1 pb-3.5 pl-[34px] text-pretty">
          {children}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  )
}

export { DisclosureGroup } from './disclosure-group'
