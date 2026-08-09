'use client'

import { useEffect, useRef, useState } from 'react'

const CONFIRM_MS = 1200

/** Copies `value`, then shows a check for a moment. Each button confirms independently. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), CONFIRM_MS)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `${label} copied` : label}
      className="border-edge text-fg-muted hover:bg-control hover:text-fg focus-visible:outline-fg rounded-control grid size-7 cursor-pointer place-items-center border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <title>Copied</title>
          <path
            d="M2 6.3 L4.6 9 L10 3.2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <title>Copy</title>
          <rect
            x="3.6"
            y="3.6"
            width="7"
            height="7"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M8.4 1.4 H2.9 A1.5 1.5 0 0 0 1.4 2.9 V8.4"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      )}
    </button>
  )
}
