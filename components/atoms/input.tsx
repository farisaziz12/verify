import type { InputHTMLAttributes } from 'react'
import { classNames } from '@/lib/class-names'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  isInvalid?: boolean
}

export function Input({ isInvalid = false, ...props }: InputProps) {
  return (
    <input
      aria-invalid={isInvalid || undefined}
      className={classNames(
        'h-control-lg rounded-control bg-control text-fg text-ui w-full border px-3 font-mono outline-none transition-colors',
        'placeholder:text-fg-faint focus:border-edge-focus',
        isInvalid ? 'border-edge-danger' : 'border-edge',
      )}
      {...props}
    />
  )
}
