'use client'

import { useEffect, useState } from 'react'
import { formatCountdown, SECOND, secondsUntil } from '@/lib/time'

export function Countdown({ to, whileUnknown }: { to: Date | null; whileUnknown: string }) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (!to) {
      setRemainingSeconds(null)
      return
    }

    const tick = () => setRemainingSeconds(secondsUntil(to))
    tick()
    const timer = setInterval(tick, SECOND)

    return () => clearInterval(timer)
  }, [to])

  if (remainingSeconds === null) return <>{whileUnknown}</>

  return <>Checking in {formatCountdown(remainingSeconds)}</>
}
