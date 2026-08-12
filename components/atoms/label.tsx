import type { ReactNode } from 'react'

export function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-fg-muted text-ui">
      {children}
    </label>
  )
}
