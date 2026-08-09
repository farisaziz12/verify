'use client'

import { useEffect, useState } from 'react'

export function RelativeTime({ value }: { value: Date | string | null }) {
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    if (!value) return
    const at = new Date(value)
    const tick = () => setText(formatRelative(at))
    tick()
    const timer = setInterval(tick, 30_000)
    return () => clearInterval(timer)
  }, [value])

  return <>{text ?? '—'}</>
}

function formatRelative(at: Date): string {
  const seconds = Math.max(0, Math.round((Date.now() - at.getTime()) / 1000))
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
