'use client'

import { Accordion } from 'radix-ui'
import type { ReactNode } from 'react'

/** A single-open accordion. */
export function DisclosureGroup({ children }: { children: ReactNode }) {
  return (
    <Accordion.Root type="single" collapsible className="flex flex-col">
      {children}
    </Accordion.Root>
  )
}
