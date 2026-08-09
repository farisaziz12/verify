import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type CardProps = Omit<HTMLAttributes<HTMLDivElement>, 'className'> & { className?: string }

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-surface border-edge bg-card overflow-hidden border', className)}
      {...props}
    />
  )
}
