'use client'

import { useEffect, useState } from 'react'
import { formatClockTime } from '@/lib/time'

/** Client-only: the formatting depends on the reader's timezone. The dash is the server render. */
export function Timestamp({ value }: { value: Date | string }) {
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    setText(formatClockTime(new Date(value)))
  }, [value])

  return <>{text ?? '—'}</>
}
