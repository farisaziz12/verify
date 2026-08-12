'use client'

import { Slider } from 'radix-ui'
import { useState } from 'react'
import { classNames } from '@/lib/class-names'

const LABEL_FADE_AT = 6

interface SlideToConfirmProps {
  label: string
  ariaLabel: string
  onConfirm: () => void
}

export function SlideToConfirm({ label, ariaLabel, onConfirm }: SlideToConfirmProps) {
  const [percent, setPercent] = useState(0)

  return (
    <Slider.Root
      value={[percent]}
      onValueChange={([next]) => setPercent(next ?? 0)}
      onValueCommit={([next]) => (next === 100 ? onConfirm() : setPercent(0))}
      max={100}
      step={1}
      className="border-edge bg-control relative flex h-10 touch-none items-center rounded-full border px-0.5 select-none"
    >
      <Slider.Track className="relative h-8 grow rounded-full">
        <Slider.Range className="bg-danger-track absolute h-full rounded-full" />
        <span
          aria-hidden
          className={classNames(
            'text-fg-subtle text-ui pointer-events-none absolute inset-0 flex items-center justify-center whitespace-nowrap transition-opacity duration-150',
            percent > LABEL_FADE_AT ? 'opacity-0' : 'opacity-100',
          )}
        >
          {label}
        </span>
      </Slider.Track>

      <Slider.Thumb
        aria-label={ariaLabel}
        className="border-edge-danger bg-danger-surface text-danger focus-visible:border-danger focus-visible:outline-fg grid h-8 w-11 cursor-grab place-items-center rounded-full border focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
          <title>Slide right</title>
          <path
            d="M1 6 H12 M8 2.5 L12 6 L8 9.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Slider.Thumb>
    </Slider.Root>
  )
}
