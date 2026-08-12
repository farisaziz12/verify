import type { HTMLAttributes } from 'react'
import { classNames } from '@/lib/class-names'

type CardProps = Omit<HTMLAttributes<HTMLDivElement>, 'className'> & { className?: string }

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={classNames(
        'rounded-surface border-edge bg-card overflow-hidden border',
        className,
      )}
      {...props}
    />
  )
}
