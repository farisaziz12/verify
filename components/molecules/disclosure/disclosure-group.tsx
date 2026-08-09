'use client'

import { Accordion } from 'radix-ui'
import type { ReactNode } from 'react'

/**
 * A single-open accordion.
 *
 * Radix supplies the heading semantics, `aria-expanded`, and the arrow-key roving focus that
 * a div-and-onClick version silently omits.
 */
export function DisclosureGroup({ children }: { children: ReactNode }) {
  return (
    <Accordion.Root type="single" collapsible className="flex flex-col">
      {children}
    </Accordion.Root>
  )
}
