import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  invalid?: boolean
}

export function Input({ invalid = false, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        'h-control-lg rounded-control bg-control text-fg text-ui w-full border px-3 font-mono outline-none transition-colors',
        'placeholder:text-fg-faint focus:border-edge-focus',
        invalid ? 'border-edge-danger' : 'border-edge',
      )}
      {...props}
    />
  )
}
