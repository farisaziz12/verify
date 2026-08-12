import { Slot } from 'radix-ui'
import type { ButtonHTMLAttributes } from 'react'
import { classNames } from '@/lib/class-names'

type Variant = 'primary' | 'ghost' | 'link' | 'danger'
type Size = 'sm' | 'md'

const VARIANT = {
  primary:
    'bg-inverse text-page border border-inverse font-medium hover:bg-inverse-hover hover:border-inverse-hover',
  ghost: 'bg-transparent text-fg border border-edge hover:border-edge-strong',
  link: 'text-fg-muted hover:text-fg w-fit border-0 bg-transparent p-0',
  danger:
    'bg-danger-surface text-danger border border-edge-danger font-medium hover:bg-danger-surface-hover hover:border-edge-danger-hover',
} satisfies Record<Variant, string>

const SIZE = {
  sm: 'h-control-sm px-2.5',
  md: 'h-control px-3.5',
} satisfies Record<Size, string>

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: Variant
  size?: Size
  asChild?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Root = asChild ? Slot.Root : 'button'
  return (
    <Root
      type={asChild ? type : (type ?? 'button')}
      className={classNames(
        'rounded-control text-ui inline-flex cursor-pointer items-center justify-center transition-colors',
        'focus-visible:outline-fg focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT[variant],
        variant !== 'link' && SIZE[size],
      )}
      {...props}
    />
  )
}
