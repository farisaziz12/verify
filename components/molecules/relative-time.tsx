'use client'

import { useEffect, useState } from 'react'
import { formatRelative, SECOND } from '@/lib/time'

const REFRESH_MS = 30 * SECOND

export function RelativeTime({ value }: { value: Date | string | null }) {
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    if (!value) return
    const at = new Date(value)
    const tick = () => setText(formatRelative(at))
    tick()
    const timer = setInterval(tick, REFRESH_MS)
    return () => clearInterval(timer)
  }, [value])

  return <>{text ?? '—'}</>
}
