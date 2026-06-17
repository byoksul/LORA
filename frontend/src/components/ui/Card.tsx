import { cn } from '@/lib/utils'
import { type HTMLAttributes, forwardRef } from 'react'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl bg-card border border-border shadow-card',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'
